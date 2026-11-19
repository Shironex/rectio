'use client';

import { ArrowCounterClockwiseIcon, ReceiptIcon } from '@phosphor-icons/react';
import {
  BlockPanel,
  pendingTotal,
  sumMoney,
  type ApprovalStatus,
  type AuditEvent,
  type ExpenseRequest,
} from '@rectio/blocks';
import { ExpenseApproval } from '@rectio/blocks/motion';
import {
  Button,
  EmptyState,
  Money,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  useToast,
} from '@rectio/ui';
import { useState } from 'react';

import { CURRENCY, LOCALE, formatShortDate, isoDay } from '@/data/company';
import { PageHeader } from '../page-header';
import { useAppData } from '../shell/app-data';
import { EmptyPanel, ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';

type Tab = 'pending' | 'approved' | 'rejected';

/** The decision on each request: who made it, when, and why for a rejection. */
function decisions(events: readonly AuditEvent[]): Map<string, AuditEvent> {
  const map = new Map<string, AuditEvent>();
  for (const event of events) {
    if (event.action === 'approved' || event.action === 'rejected') map.set(event.requestId, event);
  }
  return map;
}

/** Decided expenses, newest first, with the decision and a way to reopen one. */
function DecidedTable({
  status,
  requests,
  events,
  onReopen,
}: {
  status: Exclude<ApprovalStatus, 'pending'>;
  requests: readonly ExpenseRequest[];
  events: readonly AuditEvent[];
  onReopen: (request: ExpenseRequest) => void;
}) {
  const rows = requests
    .filter((r) => r.status === status)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  const decided = decisions(events);
  const total = sumMoney(
    rows.map((r) => r.amount),
    CURRENCY,
  );
  const title = status === 'approved' ? 'Approved' : 'Rejected';
  return (
    <BlockPanel
      title={title}
      description={
        <>
          {rows.length} {rows.length === 1 ? 'expense' : 'expenses'},{' '}
          <Money amount={total} currency={CURRENCY} locale={LOCALE} /> in total
        </>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          size="sm"
          variant="dashed"
          className="py-10"
          title={status === 'approved' ? 'Nothing approved yet' : 'Nothing rejected'}
          description="Decided expenses are listed here with who decided them."
        />
      ) : (
        <Table>
          <TableCaption className="sr-only">
            {title} expenses, amounts in {CURRENCY}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Expense</TableHead>
              <TableHead className="hidden @2xl:table-cell">Category</TableHead>
              <TableHead className="hidden @xl:table-cell">Spent</TableHead>
              <TableHead className="hidden @3xl:table-cell">Decision</TableHead>
              <TableHead align="end">Amount</TableHead>
              <TableHead className="w-0">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const decision = decided.get(r.id);
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <span className="block font-medium">{r.merchant}</span>
                    <span className="block text-sm text-fg-muted">
                      {r.employee}
                      <span className="@xl:hidden">, {formatShortDate(r.date)}</span>
                    </span>
                    {decision?.reason !== undefined && (
                      <span className="block text-sm text-fg-muted @3xl:hidden">
                        {decision.reason}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-fg-muted @2xl:table-cell">
                    {r.category}
                  </TableCell>
                  <TableCell className="hidden @xl:table-cell">
                    <time dateTime={isoDay(r.date)} className="numeric">
                      {formatShortDate(r.date)}
                    </time>
                  </TableCell>
                  <TableCell className="hidden max-w-80 @3xl:table-cell">
                    {decision === undefined ? (
                      <span className="text-fg-subtle">Not recorded</span>
                    ) : (
                      <>
                        <span className="block text-sm">
                          {decision.actor}, {formatShortDate(decision.at)}
                        </span>
                        {decision.reason !== undefined && (
                          <span className="block text-sm text-fg-muted">{decision.reason}</span>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell align="end">
                    <Money amount={r.amount} currency={CURRENCY} locale={LOCALE} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      aria-label={`Reopen ${r.merchant}, ${r.employee}`}
                      onClick={() => {
                        onReopen(r);
                      }}
                    >
                      <ArrowCounterClockwiseIcon aria-hidden weight="bold" className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </BlockPanel>
  );
}

/** The approver's desk: the queue to decide, and what has been approved or rejected. */
export function ExpensesPage() {
  const state = usePageState();
  const toast = useToast();
  const { expenses, approve, reject, reopen, openSubmitExpense } = useAppData();
  const [tab, setTab] = useState<Tab>('pending');
  const count = (status: ApprovalStatus) =>
    expenses.requests.filter((r) => r.status === status).length;
  const pending = count('pending');
  const empty = state === 'empty';
  const requests = empty ? [] : expenses.requests;
  const events = empty ? [] : expenses.events;

  const submit = (
    <Button onClick={openSubmitExpense}>
      <ReceiptIcon aria-hidden weight="bold" className="size-4" />
      Submit an expense
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Expenses"
        description={
          state === 'ready' ? (
            <>
              {pending} waiting for a decision,{' '}
              <Money
                amount={pendingTotal(expenses.requests, CURRENCY)}
                currency={CURRENCY}
                locale={LOCALE}
              />{' '}
              in total
            </>
          ) : (
            'Claims from the team'
          )
        }
        actions={submit}
      />
      {state === 'loading' ? (
        <LoadingRegion label="Loading expenses">
          <LoadingPanel kind="table" rows={8} />
        </LoadingRegion>
      ) : state === 'error' ? (
        <ErrorPanel title="Expenses did not load" />
      ) : empty ? (
        <EmptyPanel
          icon={<ReceiptIcon aria-hidden weight="bold" />}
          title="No expenses yet"
          description="When someone on the team claims a receipt, it waits here for a decision. Approved claims are paid with the next expense run."
          actions={submit}
        />
      ) : (
        <Tabs
          value={tab}
          onValueChange={(value: Tab) => {
            setTab(value);
          }}
        >
          <TabsList aria-label="Expenses by decision">
            <TabsTab value="pending" hint={pending}>
              Waiting
            </TabsTab>
            <TabsTab value="approved" hint={count('approved')}>
              Approved
            </TabsTab>
            <TabsTab value="rejected" hint={count('rejected')}>
              Rejected
            </TabsTab>
          </TabsList>
          <TabsPanel value="pending" className="pt-6">
            <ExpenseApproval
              requests={requests}
              events={events}
              currency={CURRENCY}
              locale={LOCALE}
              trailLength={6}
              onApprove={(ids) => {
                approve(ids);
                toast.add({
                  type: 'success',
                  title:
                    ids.length === 1
                      ? 'Expense approved'
                      : `${String(ids.length)} expenses approved`,
                  description: 'Paid back with the next expense run.',
                });
              }}
              onReject={(ids, reason) => {
                reject(ids, reason);
                toast.add({
                  type: 'info',
                  title:
                    ids.length === 1
                      ? 'Expense rejected'
                      : `${String(ids.length)} expenses rejected`,
                  description: 'The employee sees your reason.',
                });
              }}
              onReopen={reopen}
            />
          </TabsPanel>
          {(['approved', 'rejected'] as const).map((status) => (
            <TabsPanel key={status} value={status} className="pt-6">
              <DecidedTable
                status={status}
                requests={requests}
                events={events}
                onReopen={(request) => {
                  reopen(request.id);
                  toast.add({
                    type: 'info',
                    title: 'Expense reopened',
                    description: `${request.merchant} is waiting for a decision again.`,
                  });
                }}
              />
            </TabsPanel>
          ))}
        </Tabs>
      )}
    </>
  );
}

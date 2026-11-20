'use client';

import { ReceiptIcon } from '@phosphor-icons/react';
import { pendingTotal } from '@rectio/blocks';
import { ExpenseApproval } from '@rectio/blocks/motion';
import { Button, Money, useToast } from '@rectio/ui';

import { CURRENCY, LOCALE } from '@/data/company';
import { PageHeader } from '../page-header';
import { useAppData } from '../shell/app-data';
import { EmptyPanel, ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';

/** The approver's desk: the queue to decide, and what has been approved or rejected. */
export function ExpensesPage() {
  const state = usePageState();
  const toast = useToast();
  const { expenses, approve, reject, reopen, openSubmitExpense } = useAppData();
  const pending = expenses.requests.filter((r) => r.status === 'pending').length;
  const empty = state === 'empty';
  const requests = empty ? [] : expenses.requests;
  const events = empty ? [] : expenses.events;
  // The trail under the queue is titled Recent decisions, so submissions stay out of it.
  const decisionsOnly = events.filter((e) => e.action !== 'submitted');

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
        actions={empty ? undefined : submit}
      />
      {state === 'loading' ? (
        <LoadingRegion label="Loading expenses">
          <LoadingPanel kind="table" rows={8} columns={4} tabs={4} />
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
        <ExpenseApproval
          requests={requests}
          events={decisionsOnly}
          currency={CURRENCY}
          locale={LOCALE}
          trailLength={6}
          onApprove={(ids) => {
            approve(ids);
            toast.add({
              type: 'success',
              title:
                ids.length === 1 ? 'Expense approved' : `${String(ids.length)} expenses approved`,
              description: 'Paid back with the next expense run.',
            });
          }}
          onReject={(ids, reason) => {
            reject(ids, reason);
            toast.add({
              type: 'info',
              title:
                ids.length === 1 ? 'Expense rejected' : `${String(ids.length)} expenses rejected`,
              description: 'The employee sees your reason.',
            });
          }}
          onReopen={(id) => {
            reopen(id);
            const request = requests.find((r) => r.id === id);
            if (request === undefined) return;
            toast.add({
              type: 'info',
              title: 'Expense reopened',
              description: `${request.merchant} is waiting for a decision again.`,
            });
          }}
        />
      )}
    </>
  );
}

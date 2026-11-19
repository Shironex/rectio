'use client';

import {
  ArrowRightIcon,
  BankIcon,
  CaretDownIcon,
  CaretUpIcon,
  ClockIcon,
  FilePlusIcon,
  FileTextIcon,
  NotePencilIcon,
  ReceiptIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { BlockPanel, balanceDue, daysBetween, pendingTotal, sumMoney } from '@rectio/blocks';
import { ArAging, BudgetVsActual, CashFlowChart, KpiRow } from '@rectio/blocks/motion';
import {
  Button,
  Money,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Timeline,
  TimelineItem,
  cn,
} from '@rectio/ui';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { CURRENCY, LOCALE, TODAY, formatShortDate, formatTime, isoDay } from '@/data/company';
import { INVOICES, OVERDUE_INVOICES, RECEIVABLES } from '@/data/invoices';
import {
  ACTIVITY,
  CASH_FLOW,
  DEADLINES,
  PERIODS,
  PERIOD_FIGURES,
  type Period,
} from '@/data/overview';
import { PageHeader } from '../page-header';
import { useAppData } from '../shell/app-data';
import { EmptyPanel, ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';

interface AttentionRow {
  id: string;
  icon: ReactNode;
  tone: 'negative' | 'warning' | 'info' | 'neutral';
  title: string;
  detail: string;
  amount: number;
  href: string;
}

const TONE: Record<AttentionRow['tone'], string> = {
  negative: 'bg-negative-subtle text-negative-strong',
  warning: 'bg-warning-subtle text-warning-strong',
  info: 'bg-info-subtle text-info-strong',
  neutral: 'bg-surface-sunken text-fg-muted',
};

const plural = (n: number, one: string, many: string) => `${String(n)} ${n === 1 ? one : many}`;

/** What needs a person today: overdue money, decisions waiting, lines to match, drafts to send. */
function NeedsAttention({ className }: { className?: string }) {
  const { expenses } = useAppData();
  const pending = expenses.requests.filter((r) => r.status === 'pending');
  const flagged = pending.filter((r) => (r.flags?.length ?? 0) > 0).length;
  const drafts = INVOICES.filter((i) => i.status === 'draft');
  const oldest = OVERDUE_INVOICES.reduce<(typeof OVERDUE_INVOICES)[number] | undefined>(
    (old, i) => (old === undefined || i.due < old.due ? i : old),
    undefined,
  );
  const rows: AttentionRow[] = [
    {
      id: 'overdue',
      icon: <WarningCircleIcon aria-hidden weight="bold" className="size-4" />,
      tone: 'negative',
      title: `${plural(OVERDUE_INVOICES.length, 'invoice', 'invoices')} overdue`,
      detail:
        oldest === undefined
          ? 'Nothing is late'
          : `Oldest ${String(daysBetween(oldest.due, TODAY))} days, ${oldest.customer}`,
      amount: sumMoney(
        OVERDUE_INVOICES.map((i) => balanceDue(i, CURRENCY)),
        CURRENCY,
      ),
      href: '/invoices?filter=overdue',
    },
    {
      id: 'expenses',
      icon: <ReceiptIcon aria-hidden weight="bold" className="size-4" />,
      tone: 'warning',
      title: `${plural(pending.length, 'expense waits', 'expenses wait')} for approval`,
      detail:
        flagged === 0
          ? 'None flagged by the policy'
          : `${String(flagged)} flagged by the spend policy`,
      amount: pendingTotal(expenses.requests, CURRENCY),
      href: '/expenses',
    },
    {
      id: 'bank',
      icon: <BankIcon aria-hidden weight="bold" className="size-4" />,
      tone: 'info',
      title: '3 bank lines to match',
      detail: 'AIB current account, 17 and 18 November',
      amount: 4_912.4,
      href: '/journal?account=1000',
    },
    {
      id: 'drafts',
      icon: <NotePencilIcon aria-hidden weight="bold" className="size-4" />,
      tone: 'neutral',
      title: `${plural(drafts.length, 'draft', 'drafts')} not sent`,
      detail: [...new Set(drafts.map((d) => d.customer))].join(', '),
      amount: sumMoney(
        drafts.map((d) => d.total),
        CURRENCY,
      ),
      href: '/invoices?filter=draft',
    },
  ];
  return (
    <BlockPanel
      title="Needs attention"
      description="Today, 19 November"
      bodyClassName="px-0 pb-2"
      {...(className === undefined ? {} : { className })}
    >
      <ul className="flex flex-col">
        {rows.map((row) => (
          <li key={row.id} className="border-t border-line first:border-t-0">
            <Link
              href={row.href}
              className="group flex items-center gap-3 px-5 py-3 transition-colors duration-fast ease-standard hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
            >
              <span
                aria-hidden
                className={`flex size-8 shrink-0 items-center justify-center rounded-control ${TONE[row.tone]}`}
              >
                {row.icon}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-fg">{row.title}</span>
                <span className="truncate text-sm text-fg-muted">{row.detail}</span>
              </span>
              <Money amount={row.amount} currency={CURRENCY} locale={LOCALE} className="text-sm" />
              <ArrowRightIcon
                aria-hidden
                weight="bold"
                className="size-3.5 shrink-0 text-fg-subtle transition-transform duration-fast ease-enter group-hover:translate-x-0.5 rtl:-scale-x-100"
              />
            </Link>
          </li>
        ))}
      </ul>
    </BlockPanel>
  );
}

function RecentActivity({ className }: { className?: string }) {
  return (
    <BlockPanel
      title="Recent activity"
      description="Across the books this week"
      className={className}
    >
      <Timeline density="compact">
        {ACTIVITY.map((item) => (
          <TimelineItem
            key={item.id}
            tone={item.tone}
            title={
              <Link
                href={item.href}
                className="font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {item.title}
              </Link>
            }
            time={{
              dateTime: item.at.toISOString(),
              label: `${formatShortDate(item.at)}, ${formatTime(item.at)}`,
            }}
          >
            <p className="text-sm text-fg-muted">
              {item.detail}. <span className="text-fg-subtle">{item.actor}</span>
            </p>
          </TimelineItem>
        ))}
      </Timeline>
    </BlockPanel>
  );
}

function ComingUp({ className }: { className?: string }) {
  return (
    <BlockPanel
      title="Coming up"
      description="Deadlines the team works to"
      bodyClassName="px-0 pb-2"
      className={className}
    >
      <ul className="flex flex-col">
        {DEADLINES.map((d) => {
          const days = daysBetween(TODAY, d.due);
          return (
            <li key={d.id} className="border-t border-line first:border-t-0">
              <Link
                href={d.href}
                className="flex items-center gap-3 px-5 py-3 hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
              >
                <ClockIcon aria-hidden weight="bold" className="size-4 shrink-0 text-fg-subtle" />
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{d.title}</span>
                <time
                  dateTime={isoDay(d.due)}
                  className="text-sm whitespace-nowrap text-fg-muted numeric"
                >
                  {formatShortDate(d.due)}
                  <span className="sr-only">, </span>
                  <span className="ms-2 text-fg-subtle">in {String(days)} days</span>
                </time>
              </Link>
            </li>
          );
        })}
      </ul>
    </BlockPanel>
  );
}

function OverviewLoading() {
  return (
    <LoadingRegion label="Loading the overview">
      <LoadingPanel kind="figures" />
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-start">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <LoadingPanel kind="chart" />
          <LoadingPanel kind="table" rows={6} columns={2} className="max-lg:hidden" />
        </div>
        <div className="flex flex-col gap-6">
          <LoadingPanel kind="list" rows={4} />
          <LoadingPanel kind="chart" />
        </div>
      </div>
    </LoadingRegion>
  );
}

export function OverviewPage() {
  const state = usePageState();
  const { openNewInvoice } = useAppData();
  const [period, setPeriod] = useState<Period>('month');
  const [more, setMore] = useState(false);
  const figures = PERIOD_FIGURES[period];

  const actions = (
    <>
      <Select
        items={PERIODS}
        value={period}
        onValueChange={(value) => {
          if (value !== null) setPeriod(value);
        }}
      >
        <SelectTrigger aria-label="Period" className="sm:w-44" disabled={state === 'empty'} />
        <SelectContent>
          {PERIODS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* An empty page offers its first step in the panel, so the header does not repeat it. */}
      {state !== 'empty' && (
        <Button onClick={openNewInvoice}>
          <FilePlusIcon aria-hidden weight="bold" className="size-4" />
          New invoice
        </Button>
      )}
    </>
  );

  return (
    <>
      <PageHeader title="Overview" description={figures.label} actions={actions} />
      {state === 'loading' ? (
        <OverviewLoading />
      ) : state === 'error' ? (
        <ErrorPanel title="The overview did not load" />
      ) : state === 'empty' ? (
        <EmptyPanel
          icon={<FileTextIcon aria-hidden weight="bold" />}
          title="Your books are empty"
          description="Connect a bank account or send your first invoice. Figures, cash flow and receivables appear here as soon as there is something to count."
          actions={
            <>
              <Button variant="secondary" render={<Link href="/settings" />}>
                Connect a bank
              </Button>
              <Button onClick={openNewInvoice}>New invoice</Button>
            </>
          }
        />
      ) : (
        <>
          <KpiRow
            kpis={figures.kpis}
            currency={CURRENCY}
            locale={LOCALE}
            comparison={figures.comparison}
            label={`Key figures, ${figures.label}`}
          />
          {/*
            Two independent columns on a wide screen, so a short panel never stretches to match its
            neighbour. On a phone the columns dissolve into one list ordered by urgency, and the
            secondary panels fold away behind one button.
          */}
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-start">
            <div className="flex flex-col gap-6 max-lg:contents lg:col-span-2">
              <CashFlowChart
                points={CASH_FLOW}
                currency={CURRENCY}
                locale={LOCALE}
                title="Cash flow"
                className="max-lg:order-2"
              />
              <BudgetVsActual
                lines={figures.budget}
                currency={CURRENCY}
                locale={LOCALE}
                title="Spend against budget"
                period={figures.label}
                className={cn('max-lg:order-5', !more && 'max-lg:hidden')}
              />
              <RecentActivity className={cn('max-lg:order-7', !more && 'max-lg:hidden')} />
            </div>
            <div className="flex flex-col gap-6 max-lg:contents">
              <NeedsAttention className="max-lg:order-1" />
              <ArAging
                receivables={RECEIVABLES}
                currency={CURRENCY}
                locale={LOCALE}
                today={TODAY}
                className="max-lg:order-3"
              />
              <ComingUp className={cn('max-lg:order-6', !more && 'max-lg:hidden')} />
            </div>
            <Button
              variant="secondary"
              aria-expanded={more}
              className="max-lg:order-4 lg:hidden"
              onClick={() => {
                setMore((open) => !open);
              }}
            >
              {more ? (
                <CaretUpIcon aria-hidden weight="bold" className="size-4" />
              ) : (
                <CaretDownIcon aria-hidden weight="bold" className="size-4" />
              )}
              {more ? 'Show less' : 'Budget, deadlines and activity'}
            </Button>
          </div>
        </>
      )}
    </>
  );
}

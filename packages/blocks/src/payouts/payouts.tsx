import { ArrowClockwiseIcon, WarningOctagonIcon } from '@phosphor-icons/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  cn,
  formatMoney,
} from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { EmptyNote } from '../lib/empty-note';
import { Figures } from '../lib/figures';
import { formatShortDate, resolveLocale, sumMoney } from '../lib/finance';
import { COMMON_MESSAGES, mergeMessages, type CommonMessages } from '../lib/messages';
import { Segmented } from '../lib/segmented';
import { StateBadge } from '../lib/state-badge';
import {
  PAYOUT_FILTERS,
  matchesPayoutFilter,
  nextPayout,
  payoutTotals,
  sortPayouts,
  type Payout,
  type PayoutFilter,
  type PayoutMethod,
  type PayoutStatus,
} from './payouts.logic';

export interface PayoutsProps {
  payouts: readonly Payout[];
  /** ISO 4217 code every payout is in. */
  currency: string;
  /** BCP 47 locale for figures and dates. Defaults to the runtime locale. */
  locale?: string;
  /** The day "next 7 days" and "this month" are counted from. Pass it so the block agrees with your server. */
  today?: Date;
  title?: string;
  defaultFilter?: PayoutFilter;
  /** How many days ahead the Scheduled figure looks. */
  horizonDays?: number;
  /** Start of the period the Paid figure covers. Defaults to the first of today's month. */
  paidSince?: Date;
  /** Offers Retry on failed payouts. */
  onRetry?: (payout: Payout) => void;
  /** Payouts being retried right now: their Retry shows a spinner and ignores presses. */
  retrying?: readonly string[];
  /** Opens a payout; the payee becomes a button when given. */
  onOpenPayout?: (payout: Payout) => void;
  /** Shown in the empty state under its note, such as a button that schedules the first payout. */
  emptyAction?: ReactNode;
  /** The block's words; pass the keys you change. See `PAYOUTS_MESSAGES`. */
  messages?: Partial<PayoutsMessages>;
  className?: string;
}

export interface PayoutsMessages extends CommonMessages {
  title: string;
  /** Under the title: the next payout to leave or land. */
  next: (
    payee: string,
    amount: ReactNode,
    date: string,
    status: 'scheduled' | 'in-transit',
  ) => ReactNode;
  nothingUpcoming: string;
  scheduledSoon: (days: number) => string;
  inTransit: string;
  paidInPeriod: string;
  failed: string;
  /** The line under a figure: how many payouts it holds. */
  payoutCount: (count: number) => string;
  nothingScheduled: string;
  nothingInTransit: string;
  nothingFailed: string;
  /** Under the Failed figure when some failed: they wait for a retry. */
  toRetry: (count: number) => string;
  filterLabel: string;
  filters: Record<PayoutFilter, string>;
  methods: Record<PayoutMethod, string>;
  tableCaption: (filter: string, currency: string) => string;
  payee: string;
  date: string;
  status: string;
  amount: string;
  action: string;
  /** The date as the status means it: leaves, arrives, arrived, failed, cancelled. */
  dateLine: (status: PayoutStatus, date: string) => string;
  failureLine: (reason: string) => string;
  retry: string;
  retryLabel: (payee: string, amount: string) => string;
  emptyTitle: string;
  emptyNote: string;
  noneInFilter: (filter: string) => string;
  noneInFilterNote: string;
  showAll: string;
  /** The footer: the sum of the payouts shown; cancelled and failed ones are not counted. */
  totalRow: (count: number) => string;
  totalNote: (excluded: number) => string;
}

const DATE_WORDS: Record<PayoutStatus, string> = {
  scheduled: 'Leaves',
  'in-transit': 'Arrives',
  paid: 'Arrived',
  // The badge says failed or cancelled; the date line says when.
  failed: 'Tried',
  cancelled: 'Was due',
};

const payouts = (count: number) => `${String(count)} ${count === 1 ? 'payout' : 'payouts'}`;

export const PAYOUTS_MESSAGES: PayoutsMessages = {
  ...COMMON_MESSAGES,
  title: 'Payouts',
  next: (payee, amount, date, status) => (
    <>
      Next: {amount} to {payee}, {status === 'scheduled' ? 'leaves' : 'arrives'} {date}
    </>
  ),
  nothingUpcoming: 'Nothing scheduled or on its way',
  scheduledSoon: (days) => `Scheduled, next ${String(days)} days`,
  inTransit: 'In transit',
  paidInPeriod: 'Paid this month',
  failed: 'Failed',
  payoutCount: payouts,
  nothingScheduled: 'Nothing scheduled',
  nothingInTransit: 'Nothing on its way',
  nothingFailed: 'None failed',
  toRetry: (count) => `${payouts(count)} to retry`,
  filterLabel: 'Status',
  filters: {
    all: 'All',
    scheduled: 'Scheduled',
    'in-transit': 'In transit',
    paid: 'Paid',
    failed: 'Failed',
    cancelled: 'Cancelled',
  },
  methods: {
    'bank-transfer': 'Bank transfer',
    instant: 'Instant transfer',
    card: 'Card',
    wallet: 'Wallet',
    cheque: 'Cheque',
  },
  tableCaption: (filter, currency) => `Payouts, ${filter.toLowerCase()}, amounts in ${currency}`,
  payee: 'Payee',
  date: 'Date',
  status: 'Status',
  amount: 'Amount',
  action: 'Action',
  dateLine: (status, date) => `${DATE_WORDS[status]} ${date}`,
  failureLine: (reason) => `Bank said: ${reason}`,
  retry: 'Retry',
  retryLabel: (payee, amount) => `Retry ${amount} to ${payee}`,
  emptyTitle: 'No payouts yet',
  emptyNote: 'Payouts you schedule appear here, from leaving to landing.',
  noneInFilter: (filter) => `No ${filter.toLowerCase()} payouts`,
  noneInFilterNote: 'Every payout with this status will show here.',
  showAll: 'Show all payouts',
  totalRow: (count) => `Total, ${payouts(count)}`,
  totalNote: (excluded) =>
    excluded === 0
      ? 'Sum of the amounts shown'
      : `Sum of the amounts shown, ${String(excluded)} failed or cancelled not counted`,
};

/** Narrower blocks fold the date, then the status, under the payee, so the amount never leaves. */
const STATUS_COLUMN = 'hidden @xl:table-cell';
const DATE_COLUMN = 'hidden @3xl:table-cell';

/**
 * Money leaving to payees, from scheduled to landed: what goes out in the next days, what is on its
 * way, what arrived this month and what failed, then every payout with its state. Failed payouts
 * lead the list with the bank's reason and a Retry. Data-agnostic: typed payouts in, callbacks out.
 */
export function Payouts({
  payouts: all,
  currency,
  locale: requestedLocale,
  today = new Date(),
  title,
  defaultFilter = 'all',
  horizonDays = 7,
  paidSince,
  onRetry,
  retrying = [],
  onOpenPayout,
  emptyAction,
  messages,
  className,
}: PayoutsProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(PAYOUTS_MESSAGES, messages);
  const { Button, Money, Rows, Row } = useBlockParts();
  const [filter, setFilter] = useState<PayoutFilter>(defaultFilter);
  const totals = payoutTotals(all, today, currency, {
    horizonDays,
    ...(paidSince === undefined ? {} : { paidSince }),
  });
  const next = nextPayout(all, today);
  const shown = sortPayouts(all).filter((p) => matchesPayoutFilter(p.status, filter));
  const counted = shown.filter((p) => p.status !== 'failed' && p.status !== 'cancelled');
  const failed = totals.byStatus.failed;
  const money = (amount: number) => formatMoney(amount, currency, { locale });

  const retryButton = (payout: Payout, wide = false) =>
    onRetry === undefined || payout.status !== 'failed' ? null : (
      <Button
        variant="secondary"
        size="sm"
        loading={retrying.includes(payout.id)}
        aria-label={m.retryLabel(payout.payee, money(payout.amount))}
        // Outlined in the accent: the one recovery move on the screen.
        className={cn(
          'border-accent text-accent-strong hover:bg-accent-subtle',
          wide && 'w-full pointer-coarse:h-(--rx-button-height-touch)',
        )}
        onClick={() => {
          onRetry(payout);
        }}
      >
        <ArrowClockwiseIcon aria-hidden weight="bold" className="size-3.5" />
        {m.retry}
      </Button>
    );

  return (
    <BlockPanel
      title={title ?? m.title}
      description={
        next === undefined
          ? m.nothingUpcoming
          : m.next(
              next.payee,
              <Money amount={next.amount} currency={currency} locale={locale} />,
              formatShortDate(next.date, locale),
              next.status === 'scheduled' ? 'scheduled' : 'in-transit',
            )
      }
      className={className}
      bodyClassName="gap-4"
    >
      {all.length === 0 ? (
        <EmptyNote title={m.emptyTitle} action={emptyAction}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <>
          <Figures
            currency={currency}
            locale={locale}
            items={[
              {
                label: m.scheduledSoon(horizonDays),
                amount: totals.scheduledSoon.amount,
                note:
                  totals.scheduledSoon.count === 0
                    ? m.nothingScheduled
                    : m.payoutCount(totals.scheduledSoon.count),
              },
              {
                label: m.inTransit,
                amount: totals.byStatus['in-transit'].amount,
                note:
                  totals.byStatus['in-transit'].count === 0
                    ? m.nothingInTransit
                    : m.payoutCount(totals.byStatus['in-transit'].count),
              },
              {
                label: m.paidInPeriod,
                amount: totals.paidInPeriod.amount,
                note: m.payoutCount(totals.paidInPeriod.count),
              },
              {
                label: m.failed,
                amount: failed.amount,
                note: failed.count === 0 ? m.nothingFailed : m.toRetry(failed.count),
                ...(failed.count > 0 ? { emphasis: 'negative' as const } : {}),
              },
            ]}
          />

          <Segmented
            label={m.filterLabel}
            value={filter}
            onValueChange={setFilter}
            options={PAYOUT_FILTERS.map((value) => ({
              value,
              label: m.filters[value],
              hint: totals.counts[value],
            }))}
          />

          <Table>
            <TableCaption className="sr-only">
              {m.tableCaption(m.filters[filter], currency)}
            </TableCaption>
            <TableHeader className="@max-xl:sr-only">
              <TableRow>
                <TableHead>{m.payee}</TableHead>
                <TableHead className={DATE_COLUMN}>{m.date}</TableHead>
                <TableHead className={STATUS_COLUMN}>{m.status}</TableHead>
                <TableHead align="end">{m.amount}</TableHead>
                {onRetry !== undefined && (
                  <TableHead align="end" className={cn('w-0', STATUS_COLUMN)}>
                    <span className="sr-only">{m.action}</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-auto py-10 text-center text-fg-muted">
                    <span className="flex flex-col items-center gap-3">
                      <span className="flex flex-col items-center gap-1">
                        <span className="font-medium text-fg">
                          {m.noneInFilter(m.filters[filter])}
                        </span>
                        <span>{m.noneInFilterNote}</span>
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setFilter('all');
                        }}
                      >
                        {m.showAll}
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              ) : (
                <Rows>
                  {shown.map((payout) => {
                    const date = formatShortDate(payout.date, locale);
                    const isFailed = payout.status === 'failed';
                    return (
                      <Row key={payout.id} data-failed={isFailed || undefined}>
                        <TableCell>
                          <span className="block font-medium">
                            <Payee payout={payout} onOpen={onOpenPayout} />
                          </span>
                          <span className="block text-sm text-fg-muted">
                            {m.methods[payout.method]}
                            {payout.destination !== undefined && (
                              <span className="numeric whitespace-nowrap">
                                , {payout.destination}
                              </span>
                            )}
                            {payout.reference !== undefined && (
                              <span className="@2xl:inline hidden">, {payout.reference}</span>
                            )}
                          </span>
                          {/* Narrow: the date joins the payee, as its own column is folded away. */}
                          <span className="block text-sm text-fg-muted @3xl:hidden">
                            <span className="numeric">{m.dateLine(payout.status, date)}</span>
                          </span>
                          {isFailed && payout.failureReason !== undefined && (
                            <span className="mt-1 flex items-start gap-1.5 text-sm text-negative-strong">
                              <WarningOctagonIcon
                                aria-hidden
                                weight="bold"
                                className="mt-0.5 size-3.5 shrink-0"
                              />
                              {m.failureLine(payout.failureReason)}
                            </span>
                          )}
                          {isFailed && onRetry !== undefined && (
                            <span className="mt-2 flex @xl:hidden">
                              {retryButton(payout, true)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className={cn(DATE_COLUMN, 'whitespace-nowrap')}>
                          <span className="text-fg-muted numeric">
                            {m.dateLine(payout.status, date)}
                          </span>
                        </TableCell>
                        <TableCell className={STATUS_COLUMN}>
                          <StateBadge state={payout.status} label={m.states[payout.status]} />
                        </TableCell>
                        {/* Narrow: level with the payee's first line, not the middle of a tall row. */}
                        <TableCell align="end" className="@max-xl:align-top">
                          <span className="flex flex-col items-end gap-1">
                            <Money
                              amount={payout.amount}
                              currency={currency}
                              locale={locale}
                              className={cn(
                                'font-medium',
                                payout.status === 'cancelled' && 'text-fg-muted line-through',
                              )}
                            />
                            <span className="@xl:hidden">
                              <StateBadge state={payout.status} label={m.states[payout.status]} />
                            </span>
                          </span>
                        </TableCell>
                        {onRetry !== undefined && (
                          <TableCell align="end" className={cn('w-0', STATUS_COLUMN)}>
                            {retryButton(payout)}
                          </TableCell>
                        )}
                      </Row>
                    );
                  })}
                </Rows>
              )}
            </TableBody>
            {shown.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableHead scope="row" className="whitespace-normal text-fg">
                    <span className="flex flex-col text-sm">
                      <span className="font-medium">{m.totalRow(counted.length)}</span>
                      <span className="font-regular text-fg-muted">
                        {m.totalNote(shown.length - counted.length)}
                      </span>
                    </span>
                  </TableHead>
                  <TableCell className={DATE_COLUMN} />
                  <TableCell className={STATUS_COLUMN} />
                  <TableCell align="end">
                    <Money
                      amount={sumMoney(
                        counted.map((p) => p.amount),
                        currency,
                      )}
                      currency={currency}
                      locale={locale}
                      className="font-strong"
                    />
                  </TableCell>
                  {onRetry !== undefined && <TableCell className={cn('w-0', STATUS_COLUMN)} />}
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </>
      )}
    </BlockPanel>
  );
}

function Payee({
  payout,
  onOpen,
}: {
  payout: Payout;
  onOpen: ((payout: Payout) => void) | undefined;
}) {
  if (onOpen === undefined) return <>{payout.payee}</>;
  return (
    <button
      type="button"
      onClick={() => {
        onOpen(payout);
      }}
      className={cn(
        'cursor-pointer rounded-badge text-start text-fg underline decoration-line underline-offset-4 hover:decoration-line-strong',
        'hover:decoration-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        'pointer-coarse:min-h-(--rx-control-height-touch)',
      )}
    >
      {payout.payee}
    </button>
  );
}

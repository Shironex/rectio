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
} from '@rectio/ui';
import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Rectangle,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type TooltipContentProps,
} from 'recharts';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { EmptyNote } from '../lib/empty-note';
import {
  ChartFigure,
  ChartTooltip,
  TOOLTIP_LIFT,
  activeDatum,
  niceTicks,
  chartColor,
  type ChartColor,
} from '../lib/chart';
import { formatCompactMoney, formatPercent, resolveLocale } from '../lib/finance';
import { COMMON_MESSAGES, mergeMessages, type CommonMessages } from '../lib/messages';
import { AGING_BUCKETS, agingReport, type AgingBucket, type Receivable } from './ar-aging.logic';

export interface ArAgingProps {
  receivables: readonly Receivable[];
  currency: string;
  locale?: string;
  today?: Date;
  title?: string;
  /** How many customers the table lists before folding the rest into "Others". */
  customerLimit?: number;
  /** Shown in the empty state under its note, such as a button that creates the first invoice. */
  emptyAction?: ReactNode;
  /** The block's words; pass the keys you change. See `AR_AGING_MESSAGES`. */
  messages?: Partial<ArAgingMessages>;
  className?: string;
}

export interface ArAgingMessages extends CommonMessages {
  title: string;
  /** Under the title: "€84,200 outstanding, 38% past due". */
  summary: (outstanding: ReactNode, pastDueShare: string) => ReactNode;
  /** Each bucket's name in full, for tables, tooltips and screen readers. */
  buckets: Record<AgingBucket, string>;
  /** Each bucket's name on the chart axis and the customer table's header. */
  bucketsShort: Record<AgingBucket, string>;
  emptyTitle: string;
  emptyNote: string;
  /** The chart's summary, read before the plot; `shares` pairs each bucket with its share. */
  chartSummary: (shares: readonly { bucket: string; share: string }[]) => string;
  tooltipTitle: (bucket: string, share: string) => string;
  outstanding: string;
  bucket: string;
  share: string;
  bucketTableCaption: (currency: string) => string;
  customer: string;
  total: string;
  customerTableCaption: (currency: string) => string;
  oldestPastDue: (days: number) => string;
  nothingPastDue: string;
  /** The screen reader word for an empty bucket cell. */
  none: string;
  /** The footer's row label; `others` is how many customers are folded into the total. */
  totalRow: (others: number) => string;
}

export const AR_AGING_MESSAGES: ArAgingMessages = {
  ...COMMON_MESSAGES,
  title: 'Receivables aging',
  summary: (outstanding, pastDueShare) => (
    <>
      {outstanding} outstanding, {pastDueShare} past due
    </>
  ),
  buckets: {
    current: 'Current',
    '1-30': '1 to 30 days',
    '31-60': '31 to 60 days',
    '61-90': '61 to 90 days',
    '90+': 'Over 90 days',
  },
  bucketsShort: {
    current: 'Current',
    '1-30': '1-30',
    '31-60': '31-60',
    '61-90': '61-90',
    '90+': '90+',
  },
  emptyTitle: 'Nothing outstanding',
  emptyNote: 'Unpaid invoices appear here, grouped by how late they are.',
  chartSummary: (shares) =>
    `Receivables by days past due. ${shares.map((s) => `${s.bucket}: ${s.share}`).join('; ')}.`,
  tooltipTitle: (bucket, share) => `${bucket}, ${share} of the total`,
  outstanding: 'Outstanding',
  bucket: 'Bucket',
  share: 'Share',
  bucketTableCaption: (currency) => `Receivables by bucket, in ${currency}`,
  customer: 'Customer',
  total: 'Total',
  customerTableCaption: (currency) => `Receivables by customer and bucket, in ${currency}`,
  oldestPastDue: (days) => `Oldest ${String(days)} days past due`,
  nothingPastDue: 'Nothing past due',
  none: 'None',
  totalRow: (others) =>
    others === 0
      ? 'Total'
      : `Total, including ${String(others)} other ${others === 1 ? 'customer' : 'customers'}`,
};

const BUCKET_COLOR: Record<AgingBucket, ChartColor> = {
  current: 'sequence-1',
  '1-30': 'sequence-2',
  '31-60': 'sequence-3',
  '61-90': 'sequence-4',
  '90+': 'sequence-5',
};

interface Datum {
  bucket: AgingBucket;
  label: string;
  amount: number;
  share: number;
}

/**
 * Accounts receivable by age: how much is current and how much is 1 to 30, 31 to 60, 61 to 90 and
 * over 90 days past due, as a chart with each bucket's amount written on it, and per customer as a
 * table. Older buckets are deeper in colour and always labelled, so the colour only reinforces.
 */
export function ArAging({
  receivables,
  currency,
  locale: requestedLocale,
  today = new Date(),
  title,
  customerLimit = 6,
  emptyAction,
  messages,
  className,
}: ArAgingProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(AR_AGING_MESSAGES, messages);
  const BUCKET_LABEL = m.buckets;
  const BUCKET_SHORT = m.bucketsShort;
  const { Money } = useBlockParts();
  const report = agingReport(receivables, today, currency);
  const data: Datum[] = AGING_BUCKETS.map((bucket) => ({
    bucket,
    label: BUCKET_SHORT[bucket],
    amount: report.buckets[bucket],
    share: report.shares[bucket],
  }));
  const ticks = niceTicks(Math.max(...data.map((d) => d.amount)));
  const shown = report.customers.slice(0, customerLimit);
  const others = report.customers.length - shown.length;
  const late = formatPercent(report.total === 0 ? 0 : report.overdue / report.total, locale, {
    digits: 0,
  });

  const tooltip = (props: TooltipContentProps) => {
    const datum = activeDatum(props, data);
    if (datum === undefined) return null;
    return (
      <ChartTooltip
        layout="row"
        title={m.tooltipTitle(
          BUCKET_LABEL[datum.bucket],
          formatPercent(datum.share, locale, { digits: 0 }),
        )}
        currency={currency}
        locale={locale}
        rows={[{ label: m.outstanding, amount: datum.amount, color: BUCKET_COLOR[datum.bucket] }]}
      />
    );
  };

  return (
    <BlockPanel
      title={title ?? m.title}
      description={m.summary(
        <Money amount={report.total} currency={currency} locale={locale} />,
        late,
      )}
      className={className}
      bodyClassName="gap-4"
    >
      {receivables.length === 0 ? (
        <EmptyNote title={m.emptyTitle} action={emptyAction}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <>
          <ChartFigure
            summary={m.chartSummary(
              AGING_BUCKETS.map((b) => ({
                bucket: BUCKET_LABEL[b],
                share: formatPercent(report.shares[b], locale, { digits: 0 }),
              })),
            )}
            // A key at legible size: the bars of the late buckets are often small, so their steps
            // read here too, each beside its name.
            legend={AGING_BUCKETS.map((bucket) => ({
              label: BUCKET_LABEL[bucket],
              color: BUCKET_COLOR[bucket],
            }))}
            plotClassName="h-48"
            showTableLabel={m.showTable}
            hideTableLabel={m.hideTable}
            table={
              <Table>
                <TableCaption className="sr-only">{m.bucketTableCaption(currency)}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>{m.bucket}</TableHead>
                    <TableHead align="end">{m.outstanding}</TableHead>
                    <TableHead align="end">{m.share}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((d) => (
                    <TableRow key={d.bucket}>
                      <TableCell>{BUCKET_LABEL[d.bucket]}</TableCell>
                      <TableCell align="end">
                        <Money amount={d.amount} currency={currency} locale={locale} />
                      </TableCell>
                      <TableCell align="end" className="numeric">
                        {formatPercent(d.share, locale, { digits: 0 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            }
          >
            <BarChart
              responsive
              data={data}
              margin={{ top: 20, right: 4, bottom: 0, left: 4 }}
              style={{ width: '100%', height: '100%' }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                ticks={ticks}
                domain={[0, ticks[ticks.length - 1] ?? 1]}
                width="auto"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tickFormatter={(value: number) => formatCompactMoney(value, currency, locale)}
              />
              <Tooltip
                content={tooltip}
                cursor={{ fill: 'var(--rx-surface-hover)' }}
                // One line above the plot, over the legend, so the tooltip never covers the bars it describes.
                position={{ y: -TOOLTIP_LIFT }}
                allowEscapeViewBox={{ x: false, y: true }}
                offset={16}
                isAnimationActive={false}
              />
              <Bar
                dataKey="amount"
                name={m.outstanding}
                radius={[2, 2, 0, 0]}
                maxBarSize={56}
                isAnimationActive={false}
                shape={(props: BarShapeProps) => (
                  <Rectangle
                    {...props}
                    fill={chartColor(BUCKET_COLOR[data[props.index]?.bucket ?? 'current'])}
                  />
                )}
              >
                <LabelList
                  dataKey="amount"
                  position="top"
                  offset={6}
                  // On a narrow block the labels would collide; the table below carries the figures.
                  className="hidden fill-fg font-medium @lg:inline"
                  formatter={(value: unknown) =>
                    typeof value === 'number' ? formatCompactMoney(value, currency, locale) : ''
                  }
                />
              </Bar>
            </BarChart>
          </ChartFigure>

          <Table>
            <TableCaption className="sr-only">{m.customerTableCaption(currency)}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{m.customer}</TableHead>
                {AGING_BUCKETS.map((bucket) => (
                  <TableHead key={bucket} align="end" className="hidden @4xl:table-cell">
                    <span className="sr-only">{BUCKET_LABEL[bucket]}</span>
                    <span aria-hidden>{BUCKET_SHORT[bucket]}</span>
                  </TableHead>
                ))}
                <TableHead align="end">{m.total}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((row) => (
                <TableRow key={row.customer}>
                  <TableCell>
                    <span className="block">{row.customer}</span>
                    <span
                      className={cn(
                        'block text-sm',
                        row.oldestDaysLate > 60 ? 'text-negative-strong' : 'text-fg-muted',
                      )}
                    >
                      {row.oldestDaysLate > 0
                        ? m.oldestPastDue(row.oldestDaysLate)
                        : m.nothingPastDue}
                    </span>
                  </TableCell>
                  {AGING_BUCKETS.map((bucket) => (
                    <TableCell key={bucket} align="end" className="hidden @4xl:table-cell">
                      {row.buckets[bucket] === 0 ? (
                        // Blank, so the amounts and their staircase read at a glance.
                        <span className="sr-only">{m.none}</span>
                      ) : (
                        <Money amount={row.buckets[bucket]} currency={currency} locale={locale} />
                      )}
                    </TableCell>
                  ))}
                  <TableCell align="end">
                    <Money
                      amount={row.total}
                      currency={currency}
                      locale={locale}
                      className="font-medium"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableHead scope="row" className="whitespace-normal text-fg">
                  {m.totalRow(others)}
                </TableHead>
                {AGING_BUCKETS.map((bucket) => (
                  <TableCell key={bucket} align="end" className="hidden @4xl:table-cell">
                    <Money amount={report.buckets[bucket]} currency={currency} locale={locale} />
                  </TableCell>
                ))}
                <TableCell align="end">
                  <Money
                    amount={report.total}
                    currency={currency}
                    locale={locale}
                    className="font-strong"
                  />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </>
      )}
    </BlockPanel>
  );
}

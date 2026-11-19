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
import {
  ChartFigure,
  ChartTooltip,
  TOOLTIP_LIFT,
  activeDatum,
  chartColor,
  type ChartColor,
} from '../lib/chart';
import { formatCompactMoney, formatPercent, resolveLocale } from '../lib/finance';
import { AGING_BUCKETS, agingReport, type AgingBucket, type Receivable } from './ar-aging.logic';

export interface ArAgingProps {
  receivables: readonly Receivable[];
  currency: string;
  locale?: string;
  today?: Date;
  title?: string;
  /** How many customers the table lists before folding the rest into "Others". */
  customerLimit?: number;
  className?: string;
}

const BUCKET_LABEL: Record<AgingBucket, string> = {
  current: 'Current',
  '1-30': '1 to 30 days',
  '31-60': '31 to 60 days',
  '61-90': '61 to 90 days',
  '90+': 'Over 90 days',
};

const BUCKET_SHORT: Record<AgingBucket, string> = {
  current: 'Current',
  '1-30': '1-30',
  '31-60': '31-60',
  '61-90': '61-90',
  '90+': '90+',
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
  title = 'Receivables aging',
  customerLimit = 6,
  className,
}: ArAgingProps) {
  const locale = resolveLocale(requestedLocale);
  const { Money } = useBlockParts();
  const report = agingReport(receivables, today, currency);
  const data: Datum[] = AGING_BUCKETS.map((bucket) => ({
    bucket,
    label: BUCKET_SHORT[bucket],
    amount: report.buckets[bucket],
    share: report.shares[bucket],
  }));
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
        title={`${BUCKET_LABEL[datum.bucket]}, ${formatPercent(datum.share, locale, { digits: 0 })} of the total`}
        currency={currency}
        locale={locale}
        rows={[{ label: 'Outstanding', amount: datum.amount, color: BUCKET_COLOR[datum.bucket] }]}
      />
    );
  };

  return (
    <BlockPanel
      title={title}
      description={
        <>
          <Money amount={report.total} currency={currency} locale={locale} /> outstanding, {late}{' '}
          past due
        </>
      }
      className={className}
      bodyClassName="gap-4"
    >
      <ChartFigure
        summary={`Receivables by days past due. ${AGING_BUCKETS.map((b) => `${BUCKET_LABEL[b]}: ${formatPercent(report.shares[b], locale, { digits: 0 })}`).join('; ')}.`}
        plotClassName="h-48"
        table={
          <Table>
            <TableCaption className="sr-only">Receivables by bucket, in {currency}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Bucket</TableHead>
                <TableHead align="end">Outstanding</TableHead>
                <TableHead align="end">Share</TableHead>
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
            width="auto"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            tickFormatter={(value: number) => formatCompactMoney(value, currency, locale)}
          />
          <Tooltip
            content={tooltip}
            cursor={{ fill: 'var(--rx-surface-hover)' }}
            // Above the plot, over the legend, so the tooltip never covers the bars it describes.
            position={{ y: -TOOLTIP_LIFT }}
            allowEscapeViewBox={{ x: false, y: true }}
            offset={16}
            isAnimationActive={false}
          />
          <Bar
            dataKey="amount"
            name="Outstanding"
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
        <TableCaption className="sr-only">
          Receivables by customer and bucket, in {currency}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            {AGING_BUCKETS.map((bucket) => (
              <TableHead key={bucket} align="end" className="hidden @4xl:table-cell">
                <span className="sr-only">{BUCKET_LABEL[bucket]}</span>
                <span aria-hidden>{BUCKET_SHORT[bucket]}</span>
              </TableHead>
            ))}
            <TableHead align="end">Total</TableHead>
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
                    ? `Oldest ${String(row.oldestDaysLate)} days past due`
                    : 'Nothing past due'}
                </span>
              </TableCell>
              {AGING_BUCKETS.map((bucket) => (
                <TableCell key={bucket} align="end" className="hidden @4xl:table-cell">
                  {row.buckets[bucket] === 0 ? (
                    // Blank, so the amounts and their staircase read at a glance.
                    <span className="sr-only">None</span>
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
            <TableHead scope="row" className="text-fg">
              Total{others > 0 && `, with ${String(others)} more`}
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
    </BlockPanel>
  );
}

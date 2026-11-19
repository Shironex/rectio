import { ChartBarIcon } from '@phosphor-icons/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@rectio/ui';
import { useState, type ReactNode } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { EmptyNote } from '../lib/empty-note';
import { ChartFigure, ChartTooltip, TOOLTIP_LIFT, activeDatum, chartColor } from '../lib/chart';
import { Figures } from '../lib/figures';
import { formatCompactMoney, resolveLocale } from '../lib/finance';
import { COMMON_MESSAGES, mergeMessages, type CommonMessages } from '../lib/messages';
import { Segmented } from '../lib/segmented';
import {
  aggregateCashFlow,
  periodLabel,
  summarizeCashFlow,
  type CashFlowPeriod,
  type CashFlowPoint,
  type Granularity,
} from './cash-flow.logic';

export interface CashFlowMessages extends CommonMessages {
  title: string;
  /** The description when there are no periods. */
  noData: string;
  /** The description: the first and last period, such as "Jan 2026 to Jun 2026". */
  range: (from: string, to: string) => string;
  /** A quarter's label; `short` is the axis form. Defaults to "Q1 2026" and "Q1 26". */
  quarter: (quarter: number, year: number, short: boolean) => string;
  groupBy: string;
  monthly: string;
  quarterly: string;
  emptyTitle: string;
  emptyNote: string;
  inflow: string;
  outflow: string;
  net: string;
  /** Under the net figure: how many periods came in positive. */
  positiveNote: (positive: number, total: number, granularity: Granularity) => string;
  /** The chart's summary, read before the plot. */
  chartSummary: (info: {
    granularity: Granularity;
    range: string;
    netNegative: boolean;
    positive: number;
    total: number;
  }) => string;
  tableCaption: (granularity: Granularity, currency: string) => string;
  /** The first column's header: Month or Quarter. */
  periodHeader: (granularity: Granularity) => string;
}

export const CASH_FLOW_MESSAGES: CashFlowMessages = {
  ...COMMON_MESSAGES,
  title: 'Cash flow',
  noData: 'No data',
  range: (from, to) => `${from} to ${to}`,
  quarter: (quarter, year, short) =>
    short ? `Q${String(quarter)} ${String(year).slice(2)}` : `Q${String(quarter)} ${String(year)}`,
  groupBy: 'Group by',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  emptyTitle: 'No cash movements yet',
  emptyNote: 'Inflow and outflow appear here once payments are booked.',
  inflow: 'Inflow',
  outflow: 'Outflow',
  net: 'Net',
  positiveNote: (positive, total, granularity) =>
    `Positive in ${String(positive)} of ${String(total)} ${granularity === 'month' ? 'months' : 'quarters'}`,
  chartSummary: ({ granularity, range, netNegative, positive, total }) =>
    `Cash flow by ${granularity}, ${range}. Net ${netNegative ? 'outflow' : 'inflow'} over the period, positive in ${String(positive)} of ${String(total)} ${granularity === 'month' ? 'months' : 'quarters'}. Use the arrow keys on the chart to read each ${granularity}, or show the table.`,
  tableCaption: (granularity, currency) => `Cash flow by ${granularity}, in ${currency}`,
  periodHeader: (granularity) => (granularity === 'month' ? 'Month' : 'Quarter'),
};

/** The focused period's bars get an outline in the text colour, so the pair stands out. */
const ACTIVE_BAR = { stroke: 'var(--rx-text)', strokeWidth: 1.5 };

export interface CashFlowChartProps {
  /** One point per month. Quarters are summed from them. */
  points: readonly CashFlowPoint[];
  currency: string;
  locale?: string;
  defaultGranularity?: Granularity;
  title?: string;
  /** Shown in the empty state under its note, such as a button that imports a bank feed. */
  emptyAction?: ReactNode;
  /** The block's words; pass the keys you change. See `CASH_FLOW_MESSAGES`. */
  messages?: Partial<CashFlowMessages>;
  className?: string;
}

interface Datum extends CashFlowPeriod {
  label: string;
  /** Outflow drawn below the zero line. */
  out: number;
}

/**
 * Money in and out per month or quarter: inflow above the zero line, outflow below it and the net
 * as a line, with the totals read first and the same figures as a table.
 */
export function CashFlowChart({
  points,
  currency,
  locale: requestedLocale,
  defaultGranularity = 'month',
  title,
  emptyAction,
  messages,
  className,
}: CashFlowChartProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(CASH_FLOW_MESSAGES, messages);
  const label = (p: Pick<CashFlowPeriod, 'start'>, short = false) =>
    periodLabel(p, granularity, locale, short, m.quarter);
  const { Money } = useBlockParts();
  const [granularity, setGranularity] = useState<Granularity>(defaultGranularity);
  const periods = aggregateCashFlow(points, granularity, currency);
  const summary = summarizeCashFlow(periods, currency);
  const data: Datum[] = periods.map((p) => ({
    ...p,
    label: label(p, true),
    out: -p.outflow,
  }));
  const first = periods[0];
  const last = periods.at(-1);
  const span =
    first === undefined || last === undefined ? m.noData : m.range(label(first), label(last));

  const tooltip = (props: TooltipContentProps) => {
    const datum = activeDatum(props, data);
    if (datum === undefined) return null;
    return (
      <ChartTooltip
        layout="row"
        title={label(datum)}
        currency={currency}
        locale={locale}
        rows={[
          { label: m.inflow, amount: datum.inflow, color: 'series-1' },
          { label: m.outflow, amount: -datum.outflow, color: 'series-2' },
          { label: m.net, amount: datum.net, color: 'series-3', shape: 'line', strong: true },
        ]}
      />
    );
  };

  return (
    <BlockPanel
      title={title ?? m.title}
      description={span}
      actions={
        points.length > 0 && (
          <Segmented
            label={m.groupBy}
            value={granularity}
            onValueChange={setGranularity}
            options={[
              { value: 'month', label: m.monthly },
              { value: 'quarter', label: m.quarterly },
            ]}
          />
        )
      }
      className={className}
      bodyClassName="gap-4"
    >
      {points.length === 0 ? (
        <EmptyNote title={m.emptyTitle} action={emptyAction} icon={ChartBarIcon}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <>
          <Figures
            currency={currency}
            locale={locale}
            items={[
              { label: m.inflow, amount: summary.inflow },
              { label: m.outflow, amount: -summary.outflow, signed: false },
              {
                label: m.net,
                amount: summary.net,
                signed: true,
                note: m.positiveNote(summary.positive, periods.length, granularity),
              },
            ]}
          />
          <ChartFigure
            summary={m.chartSummary({
              granularity,
              range: span,
              netNegative: summary.net < 0,
              positive: summary.positive,
              total: periods.length,
            })}
            legend={[
              { label: m.inflow, color: 'series-1' },
              { label: m.outflow, color: 'series-2' },
              { label: m.net, color: 'series-3', shape: 'line' },
            ]}
            plotClassName="h-64"
            showTableLabel={m.showTable}
            hideTableLabel={m.hideTable}
            table={
              <Table>
                <TableCaption className="sr-only">
                  {m.tableCaption(granularity, currency)}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>{m.periodHeader(granularity)}</TableHead>
                    <TableHead align="end">{m.inflow}</TableHead>
                    <TableHead align="end">{m.outflow}</TableHead>
                    <TableHead align="end">{m.net}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((p) => (
                    <TableRow key={p.key}>
                      <TableHead
                        scope="row"
                        className="h-auto border-line bg-transparent font-normal text-fg"
                      >
                        {label(p)}
                      </TableHead>
                      <TableCell align="end">
                        <Money amount={p.inflow} currency={currency} locale={locale} />
                      </TableCell>
                      <TableCell align="end">
                        <Money amount={-p.outflow} currency={currency} locale={locale} />
                      </TableCell>
                      <TableCell align="end">
                        <Money
                          amount={p.net}
                          currency={currency}
                          locale={locale}
                          tone="auto"
                          signDisplay="exceptZero"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            }
          >
            <ComposedChart
              responsive
              data={data}
              stackOffset="sign"
              margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
              style={{ width: '100%', height: '100%' }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis
                width="auto"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tickFormatter={(value: number) => formatCompactMoney(value, currency, locale)}
              />
              <ReferenceLine y={0} className="rx-zero" stroke="var(--rx-chart-baseline)" />
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
                dataKey="inflow"
                name={m.inflow}
                stackId="flow"
                fill={chartColor('series-1')}
                radius={[2, 2, 0, 0]}
                maxBarSize={32}
                activeBar={ACTIVE_BAR}
                isAnimationActive={false}
              />
              <Bar
                dataKey="out"
                name={m.outflow}
                stackId="flow"
                fill={chartColor('series-2')}
                radius={[0, 0, 2, 2]}
                maxBarSize={32}
                activeBar={ACTIVE_BAR}
                isAnimationActive={false}
              />
              {/* A halo under the net line keeps it legible where it crosses a bar. */}
              <Line
                dataKey="net"
                tooltipType="none"
                legendType="none"
                stroke="var(--rx-chart-halo)"
                strokeWidth={6}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="net"
                name={m.net}
                stroke={chartColor('series-3')}
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: chartColor('series-3'),
                  stroke: 'var(--rx-chart-halo)',
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 4.5,
                  fill: chartColor('series-3'),
                  stroke: 'var(--rx-chart-halo)',
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartFigure>
        </>
      )}
    </BlockPanel>
  );
}

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@rectio/ui';
import { useState } from 'react';
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
import { ChartFigure, ChartTooltip, TOOLTIP_LIFT, activeDatum, chartColor } from '../lib/chart';
import { Figures } from '../lib/figures';
import { formatCompactMoney, resolveLocale } from '../lib/finance';
import { Segmented } from '../lib/segmented';
import {
  aggregateCashFlow,
  periodLabel,
  summarizeCashFlow,
  type CashFlowPeriod,
  type CashFlowPoint,
  type Granularity,
} from './cash-flow.logic';

export interface CashFlowChartProps {
  /** One point per month. Quarters are summed from them. */
  points: readonly CashFlowPoint[];
  currency: string;
  locale?: string;
  defaultGranularity?: Granularity;
  title?: string;
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
  title = 'Cash flow',
  className,
}: CashFlowChartProps) {
  const locale = resolveLocale(requestedLocale);
  const { Money } = useBlockParts();
  const [granularity, setGranularity] = useState<Granularity>(defaultGranularity);
  const periods = aggregateCashFlow(points, granularity, currency);
  const summary = summarizeCashFlow(periods, currency);
  const data: Datum[] = periods.map((p) => ({
    ...p,
    label: periodLabel(p, granularity, locale, true),
    out: -p.outflow,
  }));
  const first = periods[0];
  const last = periods.at(-1);
  const span =
    first === undefined || last === undefined
      ? 'No data'
      : `${periodLabel(first, granularity, locale)} to ${periodLabel(last, granularity, locale)}`;
  const unit = granularity === 'month' ? 'months' : 'quarters';

  const tooltip = (props: TooltipContentProps) => {
    const datum = activeDatum(props, data);
    if (datum === undefined) return null;
    return (
      <ChartTooltip
        title={periodLabel(datum, granularity, locale)}
        currency={currency}
        locale={locale}
        rows={[
          { label: 'Inflow', amount: datum.inflow, color: 'series-1' },
          { label: 'Outflow', amount: -datum.outflow, color: 'series-2' },
          { label: 'Net', amount: datum.net, color: 'series-3', shape: 'line', strong: true },
        ]}
      />
    );
  };

  return (
    <BlockPanel
      title={title}
      description={span}
      actions={
        <Segmented
          label="Group by"
          value={granularity}
          onValueChange={setGranularity}
          options={[
            { value: 'month', label: 'Monthly' },
            { value: 'quarter', label: 'Quarterly' },
          ]}
        />
      }
      className={className}
      bodyClassName="gap-4"
    >
      <Figures
        currency={currency}
        locale={locale}
        items={[
          { label: 'Inflow', amount: summary.inflow },
          { label: 'Outflow', amount: -summary.outflow, signed: false },
          {
            label: 'Net',
            amount: summary.net,
            signed: true,
            note: `Positive in ${String(summary.positive)} of ${String(periods.length)} ${unit}`,
          },
        ]}
      />
      <ChartFigure
        summary={`Cash flow by ${granularity}, ${span}. Net ${summary.net < 0 ? 'outflow' : 'inflow'} over the period, positive in ${String(summary.positive)} of ${String(periods.length)} ${unit}. Use the arrow keys on the chart to read each ${granularity}, or show the table.`}
        legend={[
          { label: 'Inflow', color: 'series-1' },
          { label: 'Outflow', color: 'series-2' },
          { label: 'Net', color: 'series-3', shape: 'line' },
        ]}
        plotClassName="h-64"
        table={
          <Table>
            <TableCaption className="sr-only">
              Cash flow by {granularity}, in {currency}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{granularity === 'month' ? 'Month' : 'Quarter'}</TableHead>
                <TableHead align="end">Inflow</TableHead>
                <TableHead align="end">Outflow</TableHead>
                <TableHead align="end">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((p) => (
                <TableRow key={p.key}>
                  <TableHead
                    scope="row"
                    className="h-auto border-line bg-transparent font-normal text-fg"
                  >
                    {periodLabel(p, granularity, locale)}
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
            // Above the plot, over the legend, so the tooltip never covers the bars it describes.
            position={{ y: -TOOLTIP_LIFT }}
            allowEscapeViewBox={{ x: false, y: true }}
            offset={16}
            isAnimationActive={false}
          />
          <Bar
            dataKey="inflow"
            name="Inflow"
            stackId="flow"
            fill={chartColor('series-1')}
            radius={[2, 2, 0, 0]}
            maxBarSize={32}
            isAnimationActive={false}
          />
          <Bar
            dataKey="out"
            name="Outflow"
            stackId="flow"
            fill={chartColor('series-2')}
            radius={[0, 0, 2, 2]}
            maxBarSize={32}
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
            name="Net"
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
    </BlockPanel>
  );
}

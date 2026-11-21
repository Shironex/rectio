'use client';

import { useId, type ReactNode } from 'react';
import {
  Bar,
  CartesianGrid,
  BarChart as RechartsBarChart,
  LabelList,
  Rectangle,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type TooltipContentProps,
} from 'recharts';

import {
  CHART_MESSAGES,
  ChartDataTable,
  ChartFrame,
  ChartTooltip,
  TOOLTIP_TOP,
  activeDatum,
  chartColor,
  mergeMessages,
  niceRangeTicks,
  CHART_PALETTE,
  paletteColor,
  useMarkAnimation,
  type ChartColor,
  type ChartMessages,
} from '../chart/chart';
import { formatValue, type ValueFormat } from '../chart/chart-format';
import { cn } from '../lib/cn';

type StringKey<T> = Extract<keyof T, string>;

export interface BarSeries<T> {
  /** The field of each datum that holds this series' figure. */
  key: StringKey<T>;
  label: string;
  /** A colour token; by default the next palette colour by position. */
  color?: ChartColor | undefined;
}

export interface BarChartMessages extends ChartMessages {
  /** The table's first column. */
  categoryHeader: string;
  tableCaption: string;
  /** The total row of a stacked chart's tooltip and table. */
  total: string;
  /** One sentence per series (or for the totals of a stack) in the summary. */
  seriesSummary: (info: {
    label: string;
    count: number;
    highest: string;
    highestValue: string;
    lowest: string;
    lowestValue: string;
  }) => string;
}

export const BAR_CHART_MESSAGES: BarChartMessages = {
  ...CHART_MESSAGES,
  categoryHeader: 'Category',
  tableCaption: 'Figures by category',
  total: 'Total',
  keyboardHint: 'Use the arrow keys on the chart to read each bar, or show the table.',
  seriesSummary: ({ label, count, highest, highestValue, lowest, lowestValue }) =>
    `${label} across ${String(count)} categories: highest ${highest} at ${highestValue}, lowest ${lowest} at ${lowestValue}.`,
};

export interface BarChartProps<T extends object> {
  data: readonly T[];
  /** The field that names each bar or group: a month, a plan, a region. */
  category: StringKey<T>;
  /** Writes the category for the axis, tooltip and table, for a date or a code. */
  formatCategory?: ((value: T[StringKey<T>], datum: T) => string) | undefined;
  series: readonly BarSeries<T>[];
  /**
   * `vertical` draws columns, for a few categories in order (months). `horizontal` draws bars,
   * for many categories or long names, ranked.
   */
  orientation?: 'vertical' | 'horizontal' | undefined;
  /** Stack the series into one bar per category, whose length is their total. Grouped otherwise. */
  stacked?: boolean | undefined;
  /** Write each bar's figure at its end. */
  labels?: boolean | undefined;
  format?: ValueFormat | undefined;
  currency?: string | undefined;
  locale?: string | undefined;
  /** Show the legend. On when there is more than one series. */
  legend?: boolean | undefined;
  summary?: string | undefined;
  loading?: boolean | undefined;
  emptyAction?: ReactNode;
  tableToggle?: boolean | undefined;
  /** Height of the plot, a token utility. Columns default to `h-64`; bars grow with their count. */
  plotClassName?: string | undefined;
  messages?: Partial<BarChartMessages> | undefined;
  className?: string | undefined;
}

/**
 * The active bar, by pointer or keyboard: a focus ring inside a halo, so the ring keeps its contrast over a pale segment
 * as well as over the card.
 */
function ACTIVE_BAR(props: BarShapeProps) {
  const { x, y, width, height, radius = 0 } = props;
  const box = { x, y, width, height, radius };
  return (
    <g>
      <Rectangle
        {...box}
        fill={props.fill ?? 'none'}
        stroke="var(--rx-chart-halo)"
        strokeWidth={4}
      />
      <Rectangle {...box} fill="none" stroke="var(--rx-focus)" strokeWidth={2} />
    </g>
  );
}

const ROW_HEIGHT: Record<number, string> = {
  1: 'h-20',
  2: 'h-28',
  3: 'h-36',
  4: 'h-44',
  5: 'h-52',
  6: 'h-60',
  7: 'h-68',
  8: 'h-76',
  9: 'h-84',
  10: 'h-92',
};

/**
 * Figures by category as columns or bars, grouped or stacked: revenue by month, tickets by team,
 * spend by vendor. The value axis counts from zero by round steps, negative figures fall below a
 * marked zero line, and the summary and the table twin say the same without the plot.
 */
export function BarChart<T extends object>({
  data,
  category,
  formatCategory,
  series,
  orientation = 'vertical',
  stacked = false,
  labels = false,
  format = 'number',
  currency,
  locale,
  legend,
  summary,
  loading,
  emptyAction,
  tableToggle,
  plotClassName,
  messages,
  className,
}: BarChartProps<T>) {
  const m = mergeMessages(BAR_CHART_MESSAGES, messages);
  const animation = useMarkAnimation();
  const horizontal = orientation === 'horizontal';
  const write = (value: number, compact = false) =>
    formatValue(value, format, { locale, currency, compact });
  const name = (datum: T) => {
    const value = datum[category];
    return formatCategory === undefined ? String(value) : formatCategory(value, datum);
  };
  const figure = (datum: T, key: StringKey<T>): number | null => {
    const value = datum[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  };
  const patternId = useId().replace(/:/g, '');
  // Past the palette, colours repeat: a repeat is hatched, so it stays apart without colour.
  const keyed = series.map((s, index) => ({
    ...s,
    tone: s.color ?? paletteColor(index),
    hatched: s.color === undefined && index >= CHART_PALETTE.length,
  }));
  const shape = (s: { hatched: boolean }) => (s.hatched ? ('hatched' as const) : ('bar' as const));
  const total = (datum: T) => keyed.reduce((sum, s) => sum + (figure(datum, s.key) ?? 0), 0);
  const rows = data.map((datum, index) => ({ datum, index, label: name(datum) }));

  // The value axis from zero; a stack measures its positive and negative sides separately.
  const highs = rows.map(({ datum }) =>
    stacked
      ? keyed.reduce((sum, s) => sum + Math.max(0, figure(datum, s.key) ?? 0), 0)
      : Math.max(0, ...keyed.map((s) => figure(datum, s.key) ?? 0)),
  );
  const lows = rows.map(({ datum }) =>
    stacked
      ? keyed.reduce((sum, s) => sum + Math.min(0, figure(datum, s.key) ?? 0), 0)
      : Math.min(0, ...keyed.map((s) => figure(datum, s.key) ?? 0)),
  );
  const ticks = niceRangeTicks(Math.min(0, ...lows), Math.max(0, ...highs));
  const negative = lows.some((low) => low < 0);

  const describe = (label: string, value: (datum: T) => number | null) => {
    const known = rows.flatMap((row) => {
      const v = value(row.datum);
      return v === null ? [] : [{ label: row.label, value: v }];
    });
    const first = known[0];
    if (first === undefined) return [];
    const highest = known.reduce((top, row) => (row.value > top.value ? row : top), first);
    const lowest = known.reduce((low, row) => (row.value < low.value ? row : low), first);
    return [
      m.seriesSummary({
        label,
        count: known.length,
        highest: highest.label,
        highestValue: write(highest.value),
        lowest: lowest.label,
        lowestValue: write(lowest.value),
      }),
    ];
  };
  const summaries =
    stacked && keyed.length > 1
      ? describe(m.total, total)
      : keyed.flatMap((s) => describe(s.label, (datum) => figure(datum, s.key)));

  const tooltip = (props: TooltipContentProps) => {
    const row = activeDatum(props, rows);
    if (row === undefined) return null;
    return (
      <ChartTooltip
        layout="row"
        title={row.label}
        rows={[
          ...keyed.map((s) => {
            const value = figure(row.datum, s.key);
            return {
              label: s.label,
              value: value === null ? '' : write(value),
              color: s.tone,
              shape: shape(s),
            };
          }),
          ...(stacked && keyed.length > 1
            ? [{ label: m.total, value: write(total(row.datum)), strong: true }]
            : []),
        ]}
      />
    );
  };

  const chartData = rows.map(({ datum, label }) => ({ ...datum, __label: label }));
  const valueAxis = {
    type: 'number' as const,
    ticks,
    domain: [ticks[0] ?? 0, ticks.at(-1) ?? 1] as [number, number],
    tickFormatter: (value: number) => write(value, true),
    tickLine: false,
    axisLine: false,
    // Bars that carry their own figures need no second readout on a value axis.
    hide: labels,
  };
  const categoryAxis = {
    type: 'category' as const,
    dataKey: '__label',
    tickLine: false,
    axisLine: false,
  };
  const height = plotClassName ?? (horizontal ? (ROW_HEIGHT[rows.length] ?? 'h-96') : 'h-64');

  return (
    <ChartFrame
      kind="bar"
      quietRing
      horizontal={horizontal}
      loading={loading}
      empty={rows.length === 0}
      emptyAction={emptyAction}
      summary={summary ?? [...summaries, m.keyboardHint].join(' ')}
      legend={
        (legend ?? keyed.length > 1)
          ? keyed.map((s) => ({ label: s.label, color: s.tone, shape: shape(s) }))
          : undefined
      }
      tableToggle={tableToggle}
      plotClassName={height}
      messages={m}
      className={cn('min-w-0', className)}
      table={
        <ChartDataTable
          caption={m.tableCaption}
          headers={[
            m.categoryHeader,
            ...keyed.map((s) => s.label),
            ...(stacked && keyed.length > 1 ? [m.total] : []),
          ]}
          rows={rows.map((row) => ({
            key: row.index,
            header: row.label,
            cells: [
              ...keyed.map((s) => {
                const value = figure(row.datum, s.key);
                return value === null ? '' : write(value);
              }),
              ...(stacked && keyed.length > 1 ? [write(total(row.datum))] : []),
            ],
          }))}
        />
      }
    >
      <RechartsBarChart
        responsive
        data={chartData}
        layout={horizontal ? 'vertical' : 'horizontal'}
        stackOffset={stacked ? 'sign' : 'none'}
        barCategoryGap={horizontal ? '28%' : '24%'}
        barGap={2}
        margin={{ top: 8, right: labels && horizontal ? 56 : 8, bottom: 0, left: 4 }}
        style={{ width: '100%', height: '100%' }}
      >
        {keyed.some((s) => s.hatched) && (
          <defs>
            {keyed
              .filter((s) => s.hatched)
              .map((s) => (
                <pattern
                  key={s.key}
                  id={`${patternId}-${s.key}`}
                  width={4}
                  height={4}
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(135)"
                >
                  <rect width={4} height={4} fill={chartColor(s.tone)} />
                  <line x1={0} y1={0} x2={0} y2={4} stroke="var(--rx-surface)" strokeWidth={2} />
                </pattern>
              ))}
          </defs>
        )}
        {/* Labelled bars drop the value axis, and its gridlines with it. */}
        {!labels && <CartesianGrid vertical={horizontal} horizontal={!horizontal} />}
        {horizontal ? (
          <>
            <XAxis {...valueAxis} tickMargin={8} />
            <YAxis {...categoryAxis} width="auto" tickMargin={12} />
          </>
        ) : (
          <>
            <XAxis {...categoryAxis} tickMargin={8} interval="preserveStartEnd" minTickGap={8} />
            <YAxis {...valueAxis} width="auto" tickMargin={4} />
          </>
        )}
        {negative && (
          <ReferenceLine
            {...(horizontal ? { x: 0 } : { y: 0 })}
            className="rx-zero"
            stroke="var(--rx-chart-baseline)"
          />
        )}
        <Tooltip
          content={tooltip}
          cursor={{ fill: 'var(--rx-surface-hover)' }}
          {...(horizontal ? {} : { position: { y: TOOLTIP_TOP } })}
          allowEscapeViewBox={{ x: false, y: true }}
          offset={16}
          isAnimationActive={false}
        />
        {keyed.map((s, index) => {
          const top = !stacked || index === keyed.length - 1;
          const radius: [number, number, number, number] = !top
            ? [0, 0, 0, 0]
            : horizontal
              ? [0, 2, 2, 0]
              : [2, 2, 0, 0];
          return (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.hatched ? `url(#${patternId}-${s.key})` : chartColor(s.tone)}
              radius={radius}
              maxBarSize={horizontal ? 20 : 32}
              activeBar={ACTIVE_BAR}
              {...(stacked ? { stackId: 'stack' } : {})}
              {...animation}
            >
              {labels && top && (
                <LabelList
                  position={horizontal ? 'right' : 'top'}
                  offset={6}
                  className="fill-fg-muted text-xs"
                  // A stack is labelled with its total, a single bar with its own figure.
                  valueAccessor={(entry: { payload?: unknown }) => {
                    const datum = entry.payload as T | undefined;
                    if (datum === undefined) return '';
                    return stacked && keyed.length > 1
                      ? total(datum)
                      : (figure(datum, s.key) ?? '');
                  }}
                  formatter={(value: unknown) =>
                    typeof value === 'number' ? write(value, true) : ''
                  }
                />
              )}
            </Bar>
          );
        })}
      </RechartsBarChart>
    </ChartFrame>
  );
}

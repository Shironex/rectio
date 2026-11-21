import { useId, useRef, type ReactNode } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';

import { cn } from '../lib/cn';
import {
  CHART_MESSAGES,
  CHART_PALETTE,
  ChartDataTable,
  ChartFrame,
  ChartTooltip,
  TOOLTIP_TOP,
  activeDatum,
  chartColor,
  mergeMessages,
  niceRangeTicks,
  paletteColor,
  useElementWidth,
  useMarkAnimation,
  type ChartColor,
  type ChartMessages,
} from './chart';
import { formatValue, type ValueFormat } from './chart-format';
import {
  crossesYear,
  fillGaps,
  formatMoment,
  formatTick,
  inferTimeScale,
  mergeSeries,
  summarizeSeries,
  timeTicks,
  type TimePoint,
  type TimeScale,
} from './time-axis';

export interface TimeSeries {
  /** Stable key for the series. */
  id: string;
  label: string;
  /** One point per moment, in any order. A `null` value, or a long run of missing moments, breaks the line. */
  points: readonly TimePoint[];
  /** A colour token; by default the series takes the next palette colour by position. */
  color?: ChartColor | undefined;
  /**
   * Draw it broken, for a forecast or a previous period, so it reads without its colour. Series
   * past the third are dashed by default, since their colour repeats.
   */
  dashed?: boolean | undefined;
}

export interface TimeChartMessages extends ChartMessages {
  /** The table's first column. */
  dateHeader: string;
  tableCaption: string;
  /** One sentence per series in the summary, read before the plot. */
  seriesSummary: (info: {
    label: string;
    first: string;
    firstDate: string;
    last: string;
    lastDate: string;
    peak: string;
    peakDate: string;
  }) => string;
}

export const TIME_CHART_MESSAGES: TimeChartMessages = {
  ...CHART_MESSAGES,
  dateHeader: 'Date',
  tableCaption: 'Figures by date',
  seriesSummary: ({ label, first, firstDate, last, lastDate, peak, peakDate }) =>
    `${label} went from ${first} on ${firstDate} to ${last} on ${lastDate}, highest at ${peak} on ${peakDate}.`,
};

export interface ReferenceMark {
  value: number;
  /** Named on the line and in the summary: Target, Budget, Last year. */
  label: string;
}

export interface TimeChartProps {
  /** One or more series on a shared time axis. */
  series: readonly TimeSeries[];
  /** How values are written on the axis, in the tooltip and in the table. */
  format?: ValueFormat | undefined;
  /** The ISO 4217 code, for `format="currency"`. */
  currency?: string | undefined;
  /** BCP 47 locale for dates and figures. Defaults to the runtime locale. */
  locale?: string | undefined;
  /** The step between points; inferred from the dates when left out. */
  scale?: TimeScale | undefined;
  /** `monotone` bends smoothly without overshooting; `linear` joins points; `step` holds each value. */
  curve?: 'monotone' | 'linear' | 'step' | undefined;
  /** `zero` counts from zero (the honest default for amounts); `fit` zooms to the data's range. */
  baseline?: 'zero' | 'fit' | undefined;
  /** Horizontal marks the data is read against, such as a target. */
  references?: readonly ReferenceMark[] | undefined;
  /** Join the line over missing moments instead of breaking it. */
  connectGaps?: boolean | undefined;
  /** A dot on every point, for a short series where each point matters. */
  markers?: boolean | undefined;
  /** Show the legend. On when there is more than one series. */
  legend?: boolean | undefined;
  /** Replaces the generated summary that screen readers hear before the plot. */
  summary?: string | undefined;
  loading?: boolean | undefined;
  /** Shown in the empty state under its note, such as a button that connects a source. */
  emptyAction?: ReactNode;
  /** Show the Show table switch. On by default. */
  tableToggle?: boolean | undefined;
  /** Height of the plot, a token utility such as `h-64` (the default). */
  plotClassName?: string | undefined;
  /** The chart's words; pass the keys you change. */
  messages?: Partial<TimeChartMessages> | undefined;
  className?: string | undefined;
}

interface Datum {
  time: number;
  gap: boolean;
  [key: string]: number | boolean | null;
}

/** About one date label per this many pixels of plot width. */
const PX_PER_TICK = 88;

/**
 * Figures over time as lines or areas: one shared implementation behind LineChart and AreaChart.
 * Dates fall on round calendar steps in the reader's language, as many as the width holds; the
 * value axis counts from zero by round steps; gaps break the line; and the summary and the table
 * twin give the same figures without the plot.
 */
export function TimeChart({
  variant,
  stacked = false,
  series,
  format = 'number',
  currency,
  locale,
  scale: requestedScale,
  curve = 'monotone',
  baseline = 'zero',
  references = [],
  connectGaps = false,
  markers = false,
  legend,
  summary,
  loading,
  emptyAction,
  tableToggle,
  plotClassName = 'h-64',
  messages,
  className,
}: TimeChartProps & { variant: 'line' | 'area'; stacked?: boolean | undefined }) {
  const m = mergeMessages(TIME_CHART_MESSAGES, messages);
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  const gradientId = useId().replace(/:/g, '');
  const animation = useMarkAnimation();

  const keyed = series.map((s, index) => ({
    ...s,
    key: `s${String(index)}`,
    tone: s.color ?? paletteColor(index),
    // Past the palette, colours repeat: a broken line keeps the repeat apart without colour.
    dashed: s.dashed ?? (s.color === undefined && index >= CHART_PALETTE.length),
  }));
  const merged = mergeSeries(keyed.map((s) => ({ id: s.key, points: s.points })));
  const scale = requestedScale ?? inferTimeScale(merged);
  const rows = connectGaps ? merged : fillGaps(merged, scale);
  const data: Datum[] = rows.map((row) => ({
    time: row.time,
    gap: row.gap === true,
    ...row.values,
  }));

  const write = (value: number, compact = false) =>
    formatValue(value, format, { locale, currency, compact });
  const moment = (date: Date) => formatMoment(date, scale, locale);

  const first = merged[0];
  const last = merged.at(-1);
  const ticks =
    first === undefined || last === undefined
      ? { ticks: [], unit: 'day' as const }
      : timeTicks(first.time, last.time, scale, width > 0 ? width / PX_PER_TICK : 6);
  const yearCrossed = crossesYear(merged);

  // The value axis: from zero by round steps, or Recharts' own fit when asked to zoom.
  const totals = merged.map((row) =>
    stacked
      ? Object.values(row.values).reduce<number>((sum, v) => sum + (v ?? 0), 0)
      : Math.max(...Object.values(row.values).map((v) => v ?? -Infinity)),
  );
  const lows = merged.map((row) =>
    Math.min(...Object.values(row.values).map((v) => v ?? Infinity)),
  );
  const max = Math.max(0, ...totals.filter(Number.isFinite), ...references.map((r) => r.value));
  const min = Math.min(0, ...lows.filter(Number.isFinite), ...references.map((r) => r.value));
  const yTicks = baseline === 'zero' ? niceRangeTicks(min, max) : undefined;

  const summaries = keyed.flatMap((s) => {
    const info = summarizeSeries(s.points);
    return info === null
      ? []
      : [
          m.seriesSummary({
            label: s.label,
            first: write(info.first.value),
            firstDate: moment(info.first.date),
            last: write(info.last.value),
            lastDate: moment(info.last.date),
            peak: write(info.peak.value),
            peakDate: moment(info.peak.date),
          }),
        ];
  });

  const tooltip = (props: TooltipContentProps) => {
    const datum = activeDatum(props, data);
    if (datum === undefined || datum.gap) return null;
    return (
      <ChartTooltip
        layout="row"
        title={moment(new Date(datum.time))}
        rows={keyed.map((s) => {
          const value = datum[s.key];
          return {
            label: s.label,
            value: typeof value === 'number' ? write(value) : '',
            color: s.tone,
            shape: s.dashed ? ('dashed' as const) : ('line' as const),
          };
        })}
      />
    );
  };

  const curveType: 'monotone' | 'linear' | 'stepAfter' = curve === 'step' ? 'stepAfter' : curve;
  const empty = merged.length === 0;

  return (
    <div ref={ref} className={cn('min-w-0', className)}>
      <ChartFrame
        kind={variant}
        loading={loading}
        empty={empty}
        emptyAction={emptyAction}
        summary={summary ?? [...summaries, m.keyboardHint].join(' ')}
        legend={
          (legend ?? keyed.length > 1)
            ? keyed.map((s) => ({
                label: s.label,
                color: s.tone,
                shape: s.dashed ? ('dashed' as const) : ('line' as const),
              }))
            : undefined
        }
        tableToggle={tableToggle}
        plotClassName={plotClassName}
        messages={m}
        table={
          <ChartDataTable
            caption={m.tableCaption}
            headers={[m.dateHeader, ...keyed.map((s) => s.label)]}
            rows={merged.map((row) => ({
              key: row.time,
              header: moment(row.date),
              cells: keyed.map((s) => {
                const value = row.values[s.key];
                return value === null || value === undefined ? '' : write(value);
              }),
            }))}
          />
        }
      >
        <ComposedChart
          responsive
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
          style={{ width: '100%', height: '100%' }}
        >
          {variant === 'area' && (
            <defs>
              {keyed.map((s) => (
                <linearGradient
                  key={s.key}
                  id={`${gradientId}-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={chartColor(s.tone)}
                    stopOpacity={stacked ? 0.5 : 0.34}
                  />
                  <stop
                    offset="100%"
                    stopColor={chartColor(s.tone)}
                    stopOpacity={stacked ? 0.18 : 0.04}
                  />
                </linearGradient>
              ))}
            </defs>
          )}
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            ticks={ticks.ticks}
            tickFormatter={(time: number) =>
              formatTick(time, ticks.unit, locale, {
                first: time === ticks.ticks[0],
                crossesYear: yearCrossed,
              })
            }
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={12}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            width="auto"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            {...(yTicks === undefined
              ? { domain: ['auto', 'auto'] }
              : { ticks: yTicks, domain: [yTicks[0] ?? 0, yTicks.at(-1) ?? 'auto'] })}
            tickFormatter={(value: number) => write(value, true)}
          />
          {min < 0 && <ReferenceLine y={0} className="rx-zero" stroke="var(--rx-chart-baseline)" />}
          {references.map((reference) => (
            <ReferenceLine
              key={reference.label}
              y={reference.value}
              stroke="var(--rx-chart-reference)"
              strokeDasharray="4 4"
              label={{
                value: reference.label,
                // Above the rule at its right end, clear of the axis labels.
                position: 'insideBottomRight',
                className: 'fill-chart-axis text-xs',
                // A halo of the surface keeps the words readable where the line crosses them.
                stroke: 'var(--rx-chart-halo)',
                strokeWidth: 3,
                paintOrder: 'stroke',
              }}
            />
          ))}
          <Tooltip
            content={tooltip}
            cursor={{ stroke: 'var(--rx-chart-reference)', strokeWidth: 1 }}
            // One line above the plot, over the legend, so it never covers the line it reads.
            position={{ y: TOOLTIP_TOP }}
            allowEscapeViewBox={{ x: false, y: true }}
            offset={16}
            isAnimationActive={false}
          />
          {keyed.map((s) => {
            const color = chartColor(s.tone);
            const shared = {
              dataKey: s.key,
              name: s.label,
              type: curveType,
              stroke: color,
              strokeWidth: 2,
              ...(s.dashed ? { strokeDasharray: '5 4' } : {}),
              dot: markers
                ? { r: 2.5, fill: color, stroke: 'var(--rx-chart-halo)', strokeWidth: 1.5 }
                : false,
              activeDot: { r: 4, fill: color, stroke: 'var(--rx-chart-halo)', strokeWidth: 2 },
              connectNulls: connectGaps,
              ...animation,
            };
            return variant === 'area' ? (
              <Area
                key={s.key}
                {...shared}
                {...(stacked ? { stackId: 'stack' } : {})}
                fill={`url(#${gradientId}-${s.key})`}
              />
            ) : (
              <Line key={s.key} {...shared} />
            );
          })}
        </ComposedChart>
      </ChartFrame>
    </div>
  );
}

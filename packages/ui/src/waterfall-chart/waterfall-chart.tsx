'use client';

import { useId, useRef, type ReactNode } from 'react';
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
  useElementWidth,
  useMarkAnimation,
  type ChartColor,
  type ChartMessages,
} from '../chart/chart';
import { extent, formatValue, type ValueFormat } from '../chart/chart-format';
import { cn } from '../lib/cn';

/**
 * A step of a waterfall. `start` opens at its figure; `delta` (the default) moves the running total
 * by its figure; `subtotal` and `end` stand from zero to the running total, and their `value` is
 * ignored, so they always add up.
 */
export interface WaterfallStep {
  id: string;
  label: string;
  value?: number | undefined;
  kind?: 'start' | 'delta' | 'subtotal' | 'end' | undefined;
}

export type WaterfallRole = 'total' | 'increase' | 'decrease';

/** A step placed on the value axis: where its bar starts and ends, and the total after it. */
export interface WaterfallBar {
  id: string;
  label: string;
  kind: NonNullable<WaterfallStep['kind']>;
  role: WaterfallRole;
  /** The step's own figure: the change for a delta, the amount for a total. */
  value: number;
  /** The running total after this step. */
  running: number;
  /** The bar's two ends on the value axis, low first. */
  range: [number, number];
}

/** Lays the steps out on the value axis, keeping the running total. */
export function waterfallBars(steps: readonly WaterfallStep[]): WaterfallBar[] {
  let running = 0;
  return steps.map((step) => {
    const kind = step.kind ?? 'delta';
    const figure = Number.isFinite(step.value) ? (step.value ?? 0) : 0;
    if (kind === 'start') {
      running = figure;
      return {
        id: step.id,
        label: step.label,
        kind,
        role: 'total',
        value: figure,
        running,
        range: [Math.min(0, figure), Math.max(0, figure)],
      };
    }
    if (kind === 'subtotal' || kind === 'end') {
      return {
        id: step.id,
        label: step.label,
        kind,
        role: 'total',
        value: running,
        running,
        range: [Math.min(0, running), Math.max(0, running)],
      };
    }
    const from = running;
    running += figure;
    return {
      id: step.id,
      label: step.label,
      kind,
      role: figure < 0 ? 'decrease' : 'increase',
      value: figure,
      running,
      range: [Math.min(from, running), Math.max(from, running)],
    };
  });
}

export interface WaterfallChartMessages extends ChartMessages {
  stepHeader: string;
  changeHeader: string;
  runningHeader: string;
  tableCaption: string;
  increase: string;
  decrease: string;
  total: string;
  summary: (info: {
    start: string;
    startLabel: string;
    end: string;
    endLabel: string;
    increases: string;
    decreases: string;
    largest?: { label: string; value: string } | undefined;
  }) => string;
}

export const WATERFALL_CHART_MESSAGES: WaterfallChartMessages = {
  ...CHART_MESSAGES,
  stepHeader: 'Step',
  changeHeader: 'Change',
  runningHeader: 'Running total',
  tableCaption: 'Each step and the running total',
  increase: 'Increase',
  decrease: 'Decrease',
  total: 'Total',
  keyboardHint: 'Use the arrow keys on the chart to read each step, or show the table.',
  summary: ({ start, startLabel, end, endLabel, increases, decreases, largest }) =>
    `From ${startLabel} ${start} to ${endLabel} ${end}: ${increases} added and ${decreases} taken away.` +
    (largest === undefined ? '' : ` The largest step is ${largest.label}, ${largest.value}.`),
};

export interface WaterfallChartProps {
  data: readonly WaterfallStep[];
  /**
   * `vertical` stands the steps side by side as columns; `horizontal` lists them down the page,
   * for long names or a narrow column. `auto` (the default) picks columns while each has room.
   */
  orientation?: 'auto' | 'vertical' | 'horizontal' | undefined;
  /** Write each step's figure at its bar. On by default; the value axis steps back when on. */
  labels?: boolean | undefined;
  format?: ValueFormat | undefined;
  currency?: string | undefined;
  locale?: string | undefined;
  /** The colour of each role: totals in the third series, increases in the first, decreases in the second. */
  colors?: Partial<Record<WaterfallRole, ChartColor>> | undefined;
  summary?: string | undefined;
  loading?: boolean | undefined;
  emptyAction?: ReactNode;
  tableToggle?: boolean | undefined;
  /** Height of the plot in columns, a token utility; rows grow with their count. */
  plotClassName?: string | undefined;
  messages?: Partial<WaterfallChartMessages> | undefined;
  className?: string | undefined;
}

const DEFAULT_COLORS: Record<WaterfallRole, ChartColor> = {
  total: 'series-3',
  increase: 'series-1',
  decrease: 'series-2',
};

const ROW_HEIGHT: Record<number, string> = {
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

/** The least room a column needs before the chart turns into rows, in px. */
const COLUMN_ROOM = 64;

/**
 * How a figure moves from a start to an end through its steps: opening cash to closing cash, last
 * year's revenue to this year's, gross to net. Increases rise in the first series, decreases fall
 * hatched in the second, so the direction reads without colour, and every figure is written with its
 * sign. Totals stand from zero; a thin rule carries the running total from one step to the next.
 */
export function WaterfallChart({
  data,
  orientation = 'auto',
  labels = true,
  format = 'number',
  currency,
  locale,
  colors,
  summary,
  loading,
  emptyAction,
  tableToggle,
  plotClassName,
  messages,
  className,
}: WaterfallChartProps) {
  const m = mergeMessages(WATERFALL_CHART_MESSAGES, messages);
  const animation = useMarkAnimation();
  const tone = { ...DEFAULT_COLORS, ...colors };
  const box = useRef<HTMLDivElement>(null);
  const width = useElementWidth(box);
  const bars = waterfallBars(data);
  const horizontal =
    orientation === 'horizontal' ||
    (orientation === 'auto' && width > 0 && width / Math.max(1, bars.length) < COLUMN_ROOM);
  const patternId = useId().replace(/:/g, '');
  const write = (value: number, options: { compact?: boolean; signed?: boolean } = {}) =>
    formatValue(value, format, { locale, currency, ...options });
  const figure = (bar: WaterfallBar, compact = false) =>
    write(bar.value, { compact, signed: bar.role !== 'total' });

  const ticks = niceRangeTicks(
    Math.min(0, extent(bars.map((bar) => bar.range[0])).min),
    Math.max(0, extent(bars.map((bar) => bar.range[1])).max),
  );
  const negative = bars.some((bar) => bar.range[0] < 0);

  const shape = (props: BarShapeProps) => {
    const { x, y, width: w, height: h, index, isActive } = props;
    const bar = bars[index];
    if (bar === undefined) return <g />;
    const fill =
      bar.role === 'decrease' ? `url(#${patternId}-decrease)` : chartColor(tone[bar.role]);
    // Where the running total sits after this bar: the high end after an increase or a positive
    // total, the low end after a decrease or a negative total.
    const atHigh = bar.role === 'increase' || (bar.role === 'total' && bar.running >= 0);
    const startsHigh = bar.role === 'decrease' || (bar.role === 'total' && bar.running >= 0);
    const low = horizontal ? x : y + h;
    const high = horizontal ? x + w : y;
    const after = atHigh ? high : low;
    const before = bar.role === 'total' ? after : startsHigh ? high : low;
    // Bars sit centred in equal bands, so the gap before this bar ends at the bar before.
    const band = props.background;
    const gap = band === undefined ? undefined : horizontal ? band.height - h : band.width - w;
    const near = horizontal ? y : x;
    const previous = index > 0 && gap !== undefined && gap > 0 ? { far: near - gap } : undefined;
    const rect = {
      x,
      y,
      width: Math.max(w, horizontal ? 1 : w),
      height: Math.max(h, horizontal ? h : 1),
    };
    return (
      <g data-dir={horizontal ? undefined : startsHigh && bar.role !== 'total' ? 'down' : 'up'}>
        {previous !== undefined && (
          <line
            aria-hidden
            className="rx-waterfall-rule"
            {...(horizontal
              ? { x1: before, x2: before, y1: previous.far, y2: near }
              : { x1: previous.far, x2: near, y1: before, y2: before })}
            stroke="var(--rx-chart-baseline)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}
        <Rectangle {...rect} radius={2} fill={fill} />
        {isActive && (
          <>
            <Rectangle {...rect} fill="none" stroke="var(--rx-chart-halo)" strokeWidth={4} />
            <Rectangle {...rect} fill="none" stroke="var(--rx-focus)" strokeWidth={2} />
          </>
        )}
      </g>
    );
  };

  const tooltip = (props: TooltipContentProps) => {
    const bar = activeDatum(props, bars);
    if (bar === undefined) return null;
    return (
      <ChartTooltip
        layout="row"
        title={bar.label}
        rows={
          bar.role === 'total'
            ? [{ label: m.total, value: write(bar.value), color: tone.total, strong: true }]
            : [
                {
                  label: bar.role === 'increase' ? m.increase : m.decrease,
                  value: figure(bar),
                  color: tone[bar.role],
                  shape: bar.role === 'decrease' ? 'hatched' : 'bar',
                },
                { label: m.runningHeader, value: write(bar.running) },
              ]
        }
      />
    );
  };

  const first = bars[0];
  const last = bars.at(-1);
  const deltas = bars.filter((bar) => bar.role !== 'total');
  const largest = deltas.reduce<WaterfallBar | undefined>(
    (top, bar) => (top === undefined || Math.abs(bar.value) > Math.abs(top.value) ? bar : top),
    undefined,
  );
  const written =
    summary ??
    (first === undefined || last === undefined
      ? ''
      : [
          m.summary({
            start: write(first.role === 'total' ? first.value : 0),
            startLabel: first.label,
            end: write(last.running),
            endLabel: last.label,
            increases: write(deltas.reduce((sum, bar) => sum + Math.max(0, bar.value), 0)),
            decreases: write(-deltas.reduce((sum, bar) => sum + Math.min(0, bar.value), 0)),
            largest:
              largest === undefined ? undefined : { label: largest.label, value: figure(largest) },
          }),
          m.keyboardHint,
        ].join(' '));

  const legendItems = [
    { label: m.increase, color: tone.increase },
    { label: m.decrease, color: tone.decrease, shape: 'hatched' as const },
    { label: m.total, color: tone.total },
  ];
  const valueAxis = {
    type: 'number' as const,
    ticks,
    domain: [ticks[0] ?? 0, ticks.at(-1) ?? 1] as [number, number],
    tickFormatter: (value: number) => write(value, { compact: true }),
    tickLine: false,
    axisLine: false,
    hide: labels,
  };
  const categoryAxis = {
    type: 'category' as const,
    dataKey: 'label',
    tickLine: false,
    axisLine: false,
  };
  const height = plotClassName ?? (horizontal ? (ROW_HEIGHT[bars.length] ?? 'h-96') : 'h-64');

  return (
    <div ref={box} className={cn('flex min-w-0 flex-col', className)}>
      <ChartFrame
        kind="bar"
        quietRing
        horizontal={horizontal}
        loading={loading}
        empty={bars.length === 0}
        emptyAction={emptyAction}
        summary={written}
        legend={legendItems}
        tableToggle={tableToggle}
        plotClassName={height}
        messages={m}
        table={
          <ChartDataTable
            caption={m.tableCaption}
            headers={[m.stepHeader, m.changeHeader, m.runningHeader]}
            rows={bars.map((bar) => ({
              key: bar.id,
              header: bar.label,
              cells: [bar.role === 'total' ? '' : figure(bar), write(bar.running)],
            }))}
          />
        }
      >
        <RechartsBarChart
          responsive
          data={bars}
          layout={horizontal ? 'vertical' : 'horizontal'}
          barCategoryGap={horizontal ? '24%' : '20%'}
          margin={{
            top: labels && !horizontal ? 20 : 8,
            right: labels && horizontal ? 64 : 8,
            bottom: 0,
            left: 4,
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <pattern
              id={`${patternId}-decrease`}
              width={4}
              height={4}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(135)"
            >
              <rect width={4} height={4} fill={chartColor(tone.decrease)} />
              <line x1={0} y1={0} x2={0} y2={4} stroke="var(--rx-surface)" strokeWidth={1.5} />
            </pattern>
          </defs>
          {!labels && <CartesianGrid vertical={horizontal} horizontal={!horizontal} />}
          {horizontal ? (
            <>
              <XAxis {...valueAxis} tickMargin={8} />
              <YAxis {...categoryAxis} width="auto" tickMargin={12} />
            </>
          ) : (
            <>
              <XAxis {...categoryAxis} tickMargin={8} interval={0} />
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
          <Bar
            dataKey="range"
            name={m.changeHeader}
            maxBarSize={horizontal ? 22 : 48}
            shape={shape}
            activeBar={shape}
            {...animation}
          >
            {labels && (
              <LabelList
                position={horizontal ? 'right' : 'top'}
                offset={6}
                className="fill-fg-muted text-xs"
                valueAccessor={(entry: { payload?: unknown }) => {
                  const bar = entry.payload as WaterfallBar | undefined;
                  return bar === undefined ? '' : figure(bar, true);
                }}
              />
            )}
          </Bar>
        </RechartsBarChart>
      </ChartFrame>
    </div>
  );
}

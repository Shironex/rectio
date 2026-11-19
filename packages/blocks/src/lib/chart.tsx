import { TableIcon } from '@phosphor-icons/react';
import { Button, Money, cn } from '@rectio/ui';
import { useId, useState, type ReactNode } from 'react';
import type { TooltipContentProps } from 'recharts';

import { useBlockParts } from './block-parts';

/** The chart colour tokens a mark can take. */
export type ChartColor =
  | 'series-1'
  | 'series-2'
  | 'series-3'
  | 'sequence-1'
  | 'sequence-2'
  | 'sequence-3'
  | 'sequence-4'
  | 'sequence-5'
  | 'reference';

/** The token as a CSS value, for Recharts props such as `fill` and `stroke`. */
export const chartColor = (color: ChartColor) => `var(--rx-chart-${color})`;

const SWATCH: Record<ChartColor, string> = {
  'series-1': 'bg-chart-series-1',
  'series-2': 'bg-chart-series-2',
  'series-3': 'bg-chart-series-3',
  'sequence-1': 'bg-chart-sequence-1',
  'sequence-2': 'bg-chart-sequence-2',
  'sequence-3': 'bg-chart-sequence-3',
  'sequence-4': 'bg-chart-sequence-4',
  'sequence-5': 'bg-chart-sequence-5',
  reference: 'bg-chart-reference',
};

/** A legend key: a square for bars, a short rule for lines. Always next to its name. */
export function Swatch({
  color,
  shape = 'bar',
}: {
  color: ChartColor;
  shape?: 'bar' | 'line' | undefined;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block shrink-0',
        shape === 'bar' ? 'size-2.5 rounded-badge' : 'h-0.5 w-3.5 rounded-full',
        SWATCH[color],
      )}
    />
  );
}

export interface LegendItem {
  label: ReactNode;
  color: ChartColor;
  shape?: 'bar' | 'line';
}

export function ChartLegend({ items }: { items: readonly LegendItem[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
      {items.map((item, index) => (
        <li key={index} className="inline-flex items-center gap-1.5">
          <Swatch color={item.color} shape={item.shape} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Axis text, gridlines and the keyboard focus ring, all from the chart tokens. Recharts writes
 * presentation attributes; these classes win over them because CSS outranks attributes.
 */
export const chartSurface = cn(
  'text-xs [&_.recharts-cartesian-axis-tick-value]:fill-chart-axis',
  '[&_.recharts-text]:font-numeric [&_.recharts-text]:tabular-nums',
  '[&_.recharts-cartesian-grid_line]:stroke-chart-grid',
  // The accessibility layer makes the plot focusable; arrows then step through the points.
  '[&_.recharts-surface]:outline-none [&_.recharts-wrapper]:rounded-control',
  '[&_.recharts-wrapper:has(.recharts-surface:focus-visible)]:outline-2',
  '[&_.recharts-wrapper:has(.recharts-surface:focus-visible)]:outline-offset-2',
  '[&_.recharts-wrapper:has(.recharts-surface:focus-visible)]:outline-focus',
);

export interface TooltipRow {
  label: ReactNode;
  amount: number;
  color?: ChartColor;
  shape?: 'bar' | 'line';
  /** Bold the row, for a total or a net figure. */
  strong?: boolean;
}

export interface ChartTooltipProps {
  title: ReactNode;
  rows: readonly TooltipRow[];
  currency: string;
  locale: string;
  /**
   * `row` lays the figures out on one line, short enough to sit over the legend row above the
   * plot, so it never hides the marks or the summary figures above them. `stack` is a column.
   */
  layout?: 'stack' | 'row';
}

/**
 * Tooltip content in the theme: the period, then each figure by name with its legend key. Money
 * signs carry the direction, so the colour key is never the only cue.
 */
export function ChartTooltip({
  title,
  rows,
  currency,
  locale,
  layout = 'stack',
}: ChartTooltipProps) {
  const row = layout === 'row';
  return (
    <div
      className={cn(
        'flex rounded-control border border-chart-tooltip-border bg-chart-tooltip px-3 py-2',
        'text-sm text-fg shadow-overlay',
        row
          ? 'flex-wrap items-center gap-x-4 gap-y-1 whitespace-nowrap'
          : 'min-w-44 flex-col gap-1.5',
      )}
    >
      <p className="font-medium">{title}</p>
      <dl className={cn('flex', row ? 'flex-wrap items-center gap-x-4 gap-y-1' : 'flex-col gap-1')}>
        {rows.map((item, index) => (
          <div
            key={index}
            className={cn('flex items-center gap-4', row ? 'gap-1.5' : 'justify-between')}
          >
            <dt className="inline-flex items-center gap-1.5 text-fg-muted">
              {item.color !== undefined && <Swatch color={item.color} shape={item.shape} />}
              {item.label}
            </dt>
            <dd className={cn('text-end', item.strong === true && 'font-strong')}>
              <Money amount={item.amount} currency={currency} locale={locale} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** How far above the plot a one-line tooltip sits, in px: over the legend row, clear of the bars. */
export const TOOLTIP_LIFT = 44;

/** The hovered or focused datum: Recharts' active index, read back into the chart's own data. */
export function activeDatum<T>(props: TooltipContentProps, data: readonly T[]): T | undefined {
  if (!props.active) return undefined;
  const index = Number(props.activeIndex);
  return Number.isInteger(index) ? data[index] : undefined;
}

export interface ChartFigureProps {
  /** One or two sentences saying what the chart shows, read before the plot. */
  summary: string;
  legend?: readonly LegendItem[];
  /** The same figures as a table: always in the page for screen readers, shown on request. */
  table: ReactNode;
  /** Height of the plot, a token utility such as `h-64`. */
  plotClassName?: string;
  /** The toggle's words, from the block's messages. */
  showTableLabel?: string;
  hideTableLabel?: string;
  children: ReactNode;
  className?: string;
}

/**
 * A chart with its legend, a toggle that shows the figures as a table, and that table. The table
 * stays in the accessibility tree while hidden, so the data never depends on seeing the plot.
 */
export function ChartFigure({
  summary,
  legend,
  table,
  plotClassName,
  showTableLabel = 'Show table',
  hideTableLabel = 'Hide table',
  children,
  className,
}: ChartFigureProps) {
  const { ChartStage } = useBlockParts();
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  return (
    <figure className={cn('m-0 flex min-w-0 flex-col gap-3', className)}>
      <figcaption className="sr-only">{summary}</figcaption>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {legend !== undefined ? <ChartLegend items={legend} /> : <span />}
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={showTable}
          aria-controls={tableId}
          onClick={() => {
            setShowTable((shown) => !shown);
          }}
          className="-me-2"
        >
          <TableIcon aria-hidden weight="bold" className="size-3.5" />
          {showTable ? hideTableLabel : showTableLabel}
        </Button>
      </div>
      <ChartStage className={cn('relative min-w-0', chartSurface, plotClassName)}>
        {children}
      </ChartStage>
      <div id={tableId} className={cn(!showTable && 'sr-only')}>
        {table}
      </div>
    </figure>
  );
}

/**
 * Round axis ticks from zero: `count` equal steps of 1, 2, 2.5 or 5 times a power of ten, the
 * smallest that leaves headroom over `max`, so the tallest mark never touches the top line.
 */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const raw = (max * 1.05) / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * power >= raw) ?? 10) * power;
  return Array.from({ length: count + 1 }, (_, index) => index * step);
}

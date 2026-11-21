import { TableIcon } from '@phosphor-icons/react';
import {
  createContext,
  use,
  useId,
  useLayoutEffect,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import type { TooltipContentProps } from 'recharts';

import { Button } from '../button/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../data-table/table';
import { EmptyState } from '../empty-state/empty-state';
import { cn } from '../lib/cn';
import { Skeleton } from '../skeleton/skeleton';

/** The chart colour tokens a mark can take: CVD-tested series, ordered sequence, and reference. */
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

/**
 * Colours for series in order: the three series tokens, the only ones that stay apart from each
 * other for every common colour vision type. Past three, colours repeat and lines turn dashed;
 * a chart with more than three series usually reads better as a table or small multiples.
 */
export const CHART_PALETTE: readonly ChartColor[] = ['series-1', 'series-2', 'series-3'];

/** The palette colour for the n-th series, wrapping after the third. */
export const paletteColor = (index: number): ChartColor =>
  CHART_PALETTE[index % CHART_PALETTE.length] ?? 'series-1';

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

/** How a legend key is drawn: a square for bars, a rule for lines, a broken rule for forecasts. */
export type SwatchShape = 'bar' | 'hatched' | 'line' | 'dashed';

/** A legend key: a square for bars, a short rule for lines. Always next to its name. */
export function Swatch({
  color,
  shape = 'bar',
}: {
  color: ChartColor;
  shape?: SwatchShape | undefined;
}) {
  if (shape === 'dashed') {
    return (
      <span aria-hidden className="inline-flex w-3.5 shrink-0 justify-between">
        <span className={cn('h-0.5 w-1.5 rounded-full', SWATCH[color])} />
        <span className={cn('h-0.5 w-1.5 rounded-full', SWATCH[color])} />
      </span>
    );
  }
  if (shape === 'hatched') {
    // The same stripes as the mark it keys, so the step reads without telling colours apart.
    return (
      <span
        aria-hidden
        className={cn('inline-block size-2.5 shrink-0 rounded-badge', SWATCH[color])}
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent 0 2px, var(--rx-surface) 2px 3px)',
        }}
      />
    );
  }
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
  shape?: SwatchShape | undefined;
}

/** Every series by name with its key, so colour is never the only way to tell them apart. */
export function ChartLegend({
  items,
  className,
}: {
  items: readonly LegendItem[];
  className?: string | undefined;
}) {
  return (
    <ul
      data-slot="chart-legend"
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted', className)}
    >
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

export interface ChartTooltipRow {
  label: ReactNode;
  /** The figure as written, already formatted. */
  value: ReactNode;
  color?: ChartColor | undefined;
  shape?: SwatchShape | undefined;
  /** Bold the row, for a total. */
  strong?: boolean | undefined;
}

export interface ChartTooltipProps {
  title: ReactNode;
  rows: readonly ChartTooltipRow[];
  /**
   * `row` lays the figures out on one line that sits over the legend above the plot, so it never
   * hides the marks it reads. `stack` is a column, for a tooltip beside the pointer.
   */
  layout?: 'stack' | 'row' | undefined;
}

/** Tooltip content in the theme: the moment or category, then each figure by name with its key. */
export function ChartTooltip({ title, rows, layout = 'stack' }: ChartTooltipProps) {
  const row = layout === 'row';
  return (
    <div
      data-slot="chart-tooltip"
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
            <dd className={cn('text-end numeric', item.strong === true && 'font-strong')}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** How far above the plot a one-line tooltip sits, in px: over the legend row, clear of the marks. */
/**
 * Where a one-line tooltip sits in the kit charts: on the top edge of the plot, in the headroom
 * the rounded axis leaves, so it never covers the legend row or the table toggle above.
 */
export const TOOLTIP_TOP = 2;

export const TOOLTIP_LIFT = 44;

/** The hovered or focused datum: Recharts' active index, read back into the chart's own data. */
export function activeDatum<T>(props: TooltipContentProps, data: readonly T[]): T | undefined {
  if (!props.active) return undefined;
  const index = Number(props.activeIndex);
  return Number.isInteger(index) ? data[index] : undefined;
}

const niceStep = (raw: number) => {
  const power = 10 ** Math.floor(Math.log10(raw));
  return ([1, 2, 2.5, 5, 10].find((m) => m * power >= raw) ?? 10) * power;
};

/**
 * Round axis ticks from zero: `count` equal steps of 1, 2, 2.5 or 5 times a power of ten, the
 * smallest that leaves headroom over `max`, so the tallest mark never touches the top line.
 */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const step = niceStep((max * 1.05) / count);
  return Array.from({ length: count + 1 }, (_, index) => index * step);
}

/** Ticks up to the first one that holds `max`, so the plot is not half empty headroom. */
function fitted(ticks: number[], max: number): number[] {
  // A tenth of headroom keeps the top mark clear of the tooltip on the top edge.
  const top = ticks.findIndex((tick) => tick >= max * 1.1);
  return top === -1 ? ticks : ticks.slice(0, Math.max(top + 1, 2));
}

/**
 * Round ticks over a range that may cross zero, always including zero, so a value axis reads from
 * a true baseline. Falls back to `niceTicks` when nothing is below zero.
 */
export function niceRangeTicks(min: number, max: number, count = 4): number[] {
  if (min >= 0) return fitted(niceTicks(max, count), max);
  if (max <= 0)
    return fitted(niceTicks(-min, count), -min)
      .map((tick) => (tick === 0 ? 0 : -tick))
      .reverse();
  const step = niceStep(((max - min) * 1.05) / count);
  const low = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let tick = low; tick < max + step; tick += step) ticks.push(Math.round(tick / step) * step);
  return ticks;
}

/** The words every chart prints. Pass the keys you change through a chart's `messages`. */
export interface ChartMessages {
  showTable: string;
  hideTable: string;
  /** Announced once while `loading` is set. */
  loading: string;
  emptyTitle: string;
  emptyDescription: string;
  /** The end of every summary: how to read the marks one by one. */
  keyboardHint: string;
}

export const CHART_MESSAGES: ChartMessages = {
  showTable: 'Show table',
  hideTable: 'Hide table',
  loading: 'Loading chart',
  emptyTitle: 'Nothing to plot yet',
  emptyDescription: 'Figures appear here as soon as the first ones come in.',
  keyboardHint: 'Use the arrow keys on the chart to read each point, or show the table.',
};

/** A chart's own words over the shared ones, with the keys the caller passed on top. */
export function mergeMessages<T extends object>(defaults: T, overrides?: Partial<T>): T {
  return overrides === undefined ? defaults : { ...defaults, ...overrides };
}

/** What a chart draws, so its loading state takes the same shape. */
export type ChartKind = 'line' | 'area' | 'bar' | 'donut';

export interface ChartStageProps {
  kind: ChartKind;
  /** Bars that run sideways, so an entrance grows them from the left. */
  horizontal?: boolean | undefined;
  children: ReactNode;
  className?: string | undefined;
}

/**
 * The parts of a chart that move in the motion variant. Charts draw the stage from this context,
 * so one chart body serves both: `@rectio/ui/charts` renders it still, `@rectio/motion/charts`
 * with an entrance on first view and Recharts' own transitions between data updates.
 */
export interface ChartMotion {
  Stage: (props: ChartStageProps) => ReactNode;
  /** Let marks travel to new values when the data changes. Off in the plain charts. */
  animateUpdates: boolean;
  /** How long an update takes, in ms. */
  updateDuration: number;
  /** The update's easing as a function of progress, built from the motion tokens. */
  updateEasing?: ((progress: number) => number) | undefined;
}

function PlainStage({ children, className }: ChartStageProps) {
  return <div className={className}>{children}</div>;
}

const PLAIN_MOTION: ChartMotion = { Stage: PlainStage, animateUpdates: false, updateDuration: 0 };

const ChartMotionContext = createContext<ChartMotion>(PLAIN_MOTION);

/** Supplies the moving parts to the charts inside it. The motion add-on wraps its charts in it. */
export function ChartMotionProvider({
  value,
  children,
}: {
  value: ChartMotion;
  children: ReactNode;
}) {
  return <ChartMotionContext value={value}>{children}</ChartMotionContext>;
}

export function useChartMotion(): ChartMotion {
  return use(ChartMotionContext);
}

/** Recharts animation props for a mark: still in the plain charts, a short glide in the motion ones. */
export function useMarkAnimation() {
  const { animateUpdates, updateDuration, updateEasing } = useChartMotion();
  return {
    isAnimationActive: animateUpdates,
    animationDuration: updateDuration,
    ...(updateEasing === undefined ? {} : { animationEasing: updateEasing }),
  };
}

/** The element's width in px, kept up to date, for choosing how many ticks fit. */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;
    setWidth(element.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box !== undefined) setWidth(box.width);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [ref]);
  return width;
}

/** A chart's data as a table: the first column names each row, the rest hold its figures. */
export interface ChartTableData {
  caption: string;
  /** The first column's header, then one per figure. */
  headers: readonly ReactNode[];
  rows: readonly { key: string | number; header: ReactNode; cells: readonly ReactNode[] }[];
  /** A last row in bold, such as totals. */
  footer?: { header: ReactNode; cells: readonly ReactNode[] } | undefined;
}

/** The table twin of a chart: the same figures, in rows a screen reader can walk. */
export function ChartDataTable({ caption, headers, rows, footer }: ChartTableData) {
  const [first, ...rest] = headers;
  return (
    <Table>
      <TableCaption className="sr-only">{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{first}</TableHead>
          {rest.map((header, index) => (
            <TableHead key={index} align="end">
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...rows, ...(footer === undefined ? [] : [{ key: 'footer', ...footer }])].map(
          (row, rowIndex) => {
            const total = footer !== undefined && rowIndex === rows.length;
            return (
              <TableRow key={row.key}>
                <TableHead
                  scope="row"
                  className={cn(
                    'h-auto border-line bg-transparent text-fg',
                    total ? 'font-strong' : 'font-normal',
                  )}
                >
                  {row.header}
                </TableHead>
                {row.cells.map((cell, index) => (
                  <TableCell
                    key={index}
                    align="end"
                    className={cn('numeric', total && 'font-strong')}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            );
          },
        )}
      </TableBody>
    </Table>
  );
}

const SKELETON_BARS = [46, 62, 38, 71, 55, 84, 66, 49, 77];

/** A chart on its way, in the plot's own size and shape, announced once. */
function ChartLoading({ kind, label }: { kind: ChartKind; label: string }) {
  return (
    <div role="status" aria-label={label} className="relative size-full">
      {kind === 'donut' ? (
        <div className="relative flex size-full items-center justify-center">
          <Skeleton animation="pulse" className="aspect-square h-4/5 max-h-48 rounded-full" />
          {/* The hole of the ring, in the surface colour. */}
          <span
            aria-hidden
            className="absolute aspect-square h-1/2 max-h-30 rounded-full bg-surface"
          />
        </div>
      ) : (
        <>
          {/* Gridlines stay still: only the data placeholders move. */}
          <div aria-hidden className="absolute inset-0 flex flex-col justify-between pb-6">
            {[0, 1, 2, 3].map((line) => (
              <span key={line} className="h-px w-full bg-chart-grid" />
            ))}
          </div>
          <div className="absolute inset-x-8 top-2 bottom-6 flex items-end justify-between gap-2">
            {SKELETON_BARS.map((height, index) => (
              <Skeleton
                key={index}
                index={index}
                animation="pulse"
                className="flex-1 rounded-b-none"
                // Bars keep their own heights; a line or an area gets a gentler ridge in the plot's middle.
                style={{ height: `${String(kind === 'bar' ? height : 30 + height / 2)}%` }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export interface ChartFrameProps {
  kind: ChartKind;
  /** Bars that run sideways. */
  horizontal?: boolean | undefined;
  /** One or two sentences saying what the chart shows, read before the plot. */
  summary: string;
  legend?: readonly LegendItem[] | undefined;
  /** The same figures as a table: in the page for screen readers, shown on request. */
  table?: ReactNode;
  /** Show the Show table switch. On by default; the table stays readable either way. */
  tableToggle?: boolean | undefined;
  loading?: boolean | undefined;
  /** Nothing to plot: the empty state takes the plot's place at the same height. */
  empty?: boolean | undefined;
  emptyAction?: ReactNode;
  /** Height of the plot, a token utility such as `h-64`. */
  plotClassName?: string | undefined;
  messages: ChartMessages;
  className?: string | undefined;
  children: ReactNode;
}

/**
 * The frame every chart shares: the legend and the table switch above the plot, the plot on its
 * stage, and the table twin below. Loading and empty states keep the plot's height, so a chart
 * that resolves never moves the page.
 */
export function ChartFrame({
  kind,
  horizontal,
  summary,
  legend,
  table,
  tableToggle = true,
  loading = false,
  empty = false,
  emptyAction,
  plotClassName = 'h-64',
  messages,
  className,
  children,
}: ChartFrameProps) {
  const { Stage } = useChartMotion();
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  if (loading || empty) {
    return (
      <div
        data-slot="chart"
        aria-busy={loading || undefined}
        className={cn('flex min-w-0 flex-col', className)}
      >
        <div className={cn('relative min-w-0', plotClassName)}>
          {loading ? (
            <ChartLoading kind={kind} label={messages.loading} />
          ) : (
            <EmptyState
              size="sm"
              variant="dashed"
              title={messages.emptyTitle}
              description={messages.emptyDescription}
              actions={emptyAction}
              className="size-full justify-center"
            />
          )}
        </div>
      </div>
    );
  }
  const hasTable = table !== undefined && table !== null;
  const showLegend = legend !== undefined && legend.length > 0;
  return (
    // It fills a taller card, so the table switch lines up across cards in a row.
    <figure data-slot="chart" className={cn('m-0 flex min-w-0 flex-1 flex-col gap-3', className)}>
      <figcaption className="sr-only">{summary}</figcaption>
      {showLegend && <ChartLegend items={legend} />}
      <Stage
        kind={kind}
        horizontal={horizontal}
        className={cn('relative min-w-0', chartSurface, plotClassName)}
      >
        {children}
      </Stage>
      {hasTable && tableToggle && (
        // Under the plot, in the same place on every chart, and right above the table it opens.
        <div className="mt-auto flex">
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={showTable}
            aria-controls={tableId}
            onClick={() => {
              setShowTable((shown) => !shown);
            }}
            className="-ms-2 text-fg-muted"
          >
            <TableIcon aria-hidden weight="bold" className="size-3.5" />
            {showTable ? messages.hideTable : messages.showTable}
          </Button>
        </div>
      )}
      {hasTable && (
        <div id={tableId} className={cn(!(showTable && tableToggle) && 'sr-only')}>
          {table}
        </div>
      )}
    </figure>
  );
}

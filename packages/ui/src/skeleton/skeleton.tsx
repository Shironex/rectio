import type { ComponentProps, CSSProperties, ReactNode } from 'react';

import { cn } from '../lib/cn';

export type SkeletonAnimation = 'shimmer' | 'pulse' | 'none';

/**
 * The delay of the n-th shape in a group, so the light runs down a preset like a wave instead of
 * every shape flashing at once. A multiple of the stagger token, so themes keep their tempo.
 */
const wave = (index: number): CSSProperties => ({
  animationDelay: `calc(var(--rx-motion-duration-stagger) * ${String(index)})`,
});

export interface SkeletonProps extends ComponentProps<'span'> {
  /**
   * `shimmer` sweeps a soft light across; `pulse` breathes in place; `none` is still. Under
   * reduced motion every skeleton is still.
   */
  animation?: SkeletonAnimation | undefined;
  /** Position in a group, for the wave. Presets set it for you. */
  index?: number | undefined;
}

/**
 * A block standing in for content that is on its way. Size it like the content it replaces, so
 * nothing moves when the content lands. Hidden from assistive technology: announce the loading
 * once on the region (presets do), not once per shape.
 */
export function Skeleton({
  animation = 'shimmer',
  index = 0,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <span
      aria-hidden
      data-slot="skeleton"
      data-animation={animation}
      className={cn(
        'relative block overflow-hidden rounded-control bg-surface-placeholder',
        animation === 'pulse' && 'animate-breathe motion-reduce:animate-none',
        className,
      )}
      style={animation === 'pulse' ? { ...wave(index), ...style } : style}
      {...props}
    >
      {animation === 'shimmer' && (
        <span
          className={cn(
            'absolute inset-0 -translate-x-full animate-shimmer motion-reduce:hidden',
            'bg-linear-to-r from-transparent from-10% via-surface-placeholder-shine via-50% to-transparent to-90% opacity-80',
          )}
          style={wave(index)}
        />
      )}
    </span>
  );
}

/** Shares of the container a line can take, written as Tailwind fractions. */
export type SkeletonFraction =
  | 'full'
  | '11/12'
  | '10/12'
  | '9/12'
  | '4/5'
  | '3/4'
  | '2/3'
  | '3/5'
  | '7/12'
  | '1/2'
  | '2/5'
  | '1/3'
  | '1/4'
  | '1/5';

/** Fixed widths from the spacing scale, for short words such as a tab, a date or a figure. */
export type SkeletonFixedWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * How wide a line is: a share of its container (`'3/4'`), a fixed preset from the spacing scale
 * (`'md'`), a percentage (`'60%'`), or any Tailwind width class (`'w-18'`).
 */
export type SkeletonWidth = SkeletonFraction | SkeletonFixedWidth | `${number}%` | `w-${string}`;

/** Written out in full so Tailwind sees every class. */
const FRACTION: Record<SkeletonFraction, string> = {
  full: 'w-full',
  '11/12': 'w-11/12',
  '10/12': 'w-10/12',
  '9/12': 'w-9/12',
  '4/5': 'w-4/5',
  '3/4': 'w-3/4',
  '2/3': 'w-2/3',
  '3/5': 'w-3/5',
  '7/12': 'w-7/12',
  '1/2': 'w-1/2',
  '2/5': 'w-2/5',
  '1/3': 'w-1/3',
  '1/4': 'w-1/4',
  '1/5': 'w-1/5',
};

/** A word, a short label, a date, a figure, a heading, a long title. */
const FIXED: Record<SkeletonFixedWidth, string> = {
  xs: 'w-8',
  sm: 'w-14',
  md: 'w-20',
  lg: 'w-32',
  xl: 'w-48',
  '2xl': 'w-64',
};

/** The class and style a width becomes. Percentages are geometry, not a design value. */
export function skeletonWidth(width: SkeletonWidth): { className?: string; style?: CSSProperties } {
  if (width in FRACTION) return { className: FRACTION[width as SkeletonFraction] };
  if (width in FIXED) return { className: FIXED[width as SkeletonFixedWidth] };
  if (width.endsWith('%')) {
    const share = Math.min(100, Math.max(0, Number.parseFloat(width)));
    return Number.isFinite(share) ? { style: { width: `${String(share)}%` } } : {};
  }
  return { className: width };
}

export interface SkeletonLineProps extends SkeletonProps {
  /**
   * Width of the line: `'3/4'` of its container, a fixed `'md'`, `'60%'`, or a Tailwind width
   * class such as `'w-18'`. Default `'full'`.
   */
  width?: SkeletonWidth | undefined;
  /** Text size the line stands in for, so its height matches a real line. */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | undefined;
}

const LINE: Record<NonNullable<SkeletonLineProps['size']>, string> = {
  xs: 'h-2.5',
  sm: 'h-3',
  base: 'h-3.5',
  lg: 'h-4',
  xl: 'h-5',
  '2xl': 'h-6',
};

/** One line of text: the height of the type's x-height, with a line's worth of space around it. */
export function SkeletonLine({
  width = 'full',
  size = 'base',
  className,
  style,
  ...props
}: SkeletonLineProps) {
  const resolved = skeletonWidth(width);
  return (
    <Skeleton
      data-width={width}
      className={cn('max-w-full rounded-badge', LINE[size], resolved.className, className)}
      style={resolved.style === undefined ? style : { ...resolved.style, ...style }}
      {...props}
    />
  );
}

export interface SkeletonCircleProps extends SkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | undefined;
}

const CIRCLE = { sm: 'size-6', md: 'size-8', lg: 'size-10', xl: 'size-14' } as const;

/** An avatar or an icon tile on its way. */
export function SkeletonCircle({ size = 'md', className, ...props }: SkeletonCircleProps) {
  return <Skeleton className={cn('shrink-0 rounded-full', CIRCLE[size], className)} {...props} />;
}

interface PresetProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Announced once when the placeholder appears. */
  label?: string | undefined;
  animation?: SkeletonAnimation | undefined;
}

/** The region a preset fills: one live announcement, then shapes that are not read. */
function Preset({
  label = 'Loading',
  className,
  children,
  ...props
}: Omit<PresetProps, 'animation'> & { children: ReactNode }) {
  return (
    <div
      role="status"
      aria-busy="true"
      data-slot="skeleton-preset"
      className={cn('flex flex-col', className)}
      {...props}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Widths that read as prose: long lines of slightly different length, a short last line. */
const PROSE: readonly SkeletonFraction[] = ['full', '11/12', 'full', '10/12', 'full', '9/12'];

export interface SkeletonTextProps extends PresetProps {
  lines?: number | undefined;
  size?: SkeletonLineProps['size'] | undefined;
  /** A heading line above the paragraph. */
  heading?: boolean | undefined;
}

export function SkeletonText({
  lines = 3,
  size = 'base',
  heading = false,
  animation,
  className,
  ...props
}: SkeletonTextProps) {
  return (
    <Preset className={cn('gap-2.5', className)} {...props}>
      {heading && <SkeletonLine size="xl" width="2/5" animation={animation} className="mb-1.5" />}
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine
          key={i}
          size={size}
          index={i + (heading ? 1 : 0)}
          animation={animation}
          width={i === lines - 1 && lines > 1 ? '7/12' : PROSE[i % PROSE.length]}
        />
      ))}
    </Preset>
  );
}

export interface SkeletonCardProps extends PresetProps {
  /** A media block on top, such as a cover image or a chart. */
  media?: boolean | undefined;
}

/** A card on its way: optional media, a title, two lines, and a footer with a person. */
export function SkeletonCard({ media = true, animation, className, ...props }: SkeletonCardProps) {
  return (
    <Preset
      className={cn('overflow-hidden rounded-panel border border-line bg-surface', className)}
      {...props}
    >
      {media && <Skeleton animation={animation} className="aspect-video rounded-none" />}
      <div className="flex flex-col gap-2.5 px-5 py-4">
        <SkeletonLine size="lg" width="3/5" index={1} animation={animation} />
        <SkeletonLine size="sm" index={2} animation={animation} />
        <SkeletonLine size="sm" width="4/5" index={3} animation={animation} />
      </div>
      <div className="flex items-center gap-3 border-t border-line px-5 py-3">
        <SkeletonCircle size="sm" index={4} animation={animation} />
        <SkeletonLine size="sm" width="1/3" index={4} animation={animation} />
        <SkeletonLine size="sm" width="w-12" index={5} animation={animation} className="ms-auto" />
      </div>
    </Preset>
  );
}

export interface SkeletonTableProps extends PresetProps {
  rows?: number | undefined;
  columns?: number | undefined;
  /** The last column is a figure: right-aligned and narrower, like an amount column. */
  numeric?: boolean | undefined;
}

/** Column widths that vary like real data, never a grid of equal bars. */
const CELL: readonly SkeletonFraction[] = ['4/5', '3/5', '2/3', '1/2', '3/4', '2/5'];

/** Rows of a table on their way, with a header band, under the real column count. */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  numeric = true,
  animation,
  className,
  ...props
}: SkeletonTableProps) {
  const grid = { gridTemplateColumns: `repeat(${String(columns)}, minmax(0, 1fr))` };
  return (
    <Preset
      className={cn('overflow-hidden rounded-panel border border-line bg-surface', className)}
      {...props}
    >
      <div
        className="grid h-(--rx-table-header-height) items-center gap-4 border-b border-line bg-(--rx-table-header-background) px-(--rx-table-cell-padding-x)"
        style={grid}
      >
        {Array.from({ length: columns }, (_, c) => (
          <SkeletonLine
            key={c}
            size="xs"
            animation="none"
            width={c === columns - 1 && numeric ? '1/3' : '2/5'}
            className={cn(c === columns - 1 && numeric && 'ms-auto', 'bg-line')}
          />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          className="grid h-(--rx-table-row-height) items-center gap-4 border-b border-line px-(--rx-table-cell-padding-x) last:border-b-0"
          style={grid}
        >
          {Array.from({ length: columns }, (_, c) => {
            const figure = c === columns - 1 && numeric;
            return (
              <SkeletonLine
                key={c}
                size="sm"
                index={r}
                animation={animation}
                width={figure ? '1/2' : CELL[(r * 3 + c * 2) % CELL.length]}
                className={cn(figure && 'ms-auto')}
              />
            );
          })}
        </div>
      ))}
    </Preset>
  );
}

export interface SkeletonListItemProps extends PresetProps {
  /** How many items. */
  count?: number | undefined;
  /** A trailing figure or date on each item. */
  meta?: boolean | undefined;
}

/** Items of a list with an avatar, two lines and a trailing figure, divided by hairlines. */
export function SkeletonListItem({
  count = 1,
  meta = true,
  animation,
  className,
  ...props
}: SkeletonListItemProps) {
  return (
    <Preset className={cn('divide-y divide-line', className)} {...props}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <SkeletonCircle index={i} animation={animation} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <SkeletonLine
              size="sm"
              index={i}
              animation={animation}
              width={i % 2 === 0 ? '2/5' : '1/2'}
            />
            <SkeletonLine
              size="xs"
              index={i}
              animation={animation}
              width={i % 2 === 0 ? '3/5' : '2/5'}
            />
          </div>
          {meta && <SkeletonLine size="sm" width="sm" index={i} animation={animation} />}
        </div>
      ))}
    </Preset>
  );
}

export interface SkeletonChartProps extends PresetProps {
  kind?: 'bar' | 'line' | undefined;
  /** Bars or points along the axis. */
  points?: number | undefined;
}

/** Heights that rise and fall like a season of figures, never a staircase. */
const SERIES = [46, 62, 38, 71, 55, 84, 66, 49, 77, 58, 90, 69];

/** A chart on its way: gridlines, a baseline, and bars or a line, in the chart's own frame. */
export function SkeletonChart({
  kind = 'bar',
  points = 9,
  animation = 'shimmer',
  className,
  ...props
}: SkeletonChartProps) {
  const values = Array.from({ length: points }, (_, i) => SERIES[i % SERIES.length] ?? 50);
  const last = (points - 1) * 10;
  // Each segment bends through the midpoint between its ends, so the line reads as a trend.
  const curve = values
    .map((v, i) => {
      const x = i * 10;
      const y = 100 - v;
      if (i === 0) return `M 0,${String(y)}`;
      const px = x - 10;
      const py = 100 - (values[i - 1] ?? v);
      return `C ${String(px + 5)},${String(py)} ${String(x - 5)},${String(y)} ${String(x)},${String(y)}`;
    })
    .join(' ');
  return (
    <Preset className={cn('gap-3', className)} {...props}>
      <div className="flex items-end justify-between">
        <SkeletonLine size="lg" width="1/3" animation={animation} />
        <SkeletonLine size="sm" width="md" animation={animation} index={1} />
      </div>
      <div className="relative h-48">
        {/* Gridlines are drawn still: only the data placeholders move. */}
        <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((g) => (
            <span key={g} className="h-px w-full bg-line" />
          ))}
        </div>
        {kind === 'bar' ? (
          <div className="absolute inset-x-2 top-0 bottom-px flex items-end justify-between gap-2">
            {values.map((v, i) => (
              <Skeleton
                key={i}
                index={i}
                animation={animation}
                className="flex-1 rounded-b-none"
                style={{ height: `${String(v)}%` }}
              />
            ))}
          </div>
        ) : (
          <svg
            aria-hidden
            viewBox={`0 0 ${String((points - 1) * 10)} 100`}
            preserveAspectRatio="none"
            className={cn(
              'absolute inset-0 size-full overflow-visible text-surface-placeholder',
              animation !== 'none' && 'animate-breathe motion-reduce:animate-none',
            )}
          >
            {/* A faint area under a smooth line: the weight of a filled trend chart. */}
            <path
              d={`${curve} L ${String(last)},100 L 0,100 Z`}
              fill="currentColor"
              fillOpacity={0.6}
            />
            <path
              d={curve}
              fill="none"
              strokeWidth={2}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="stroke-line-strong"
            />
          </svg>
        )}
      </div>
      <div className="flex justify-between px-2">
        {Array.from({ length: Math.min(points, 6) }, (_, i) => (
          <SkeletonLine key={i} size="xs" width="xs" animation="none" />
        ))}
      </div>
    </Preset>
  );
}

export interface SkeletonSwapProps {
  /** While true, the fallback shows; then the content replaces it. */
  loading: boolean;
  /** The placeholder, usually a preset sized like the content. */
  fallback: ReactNode;
  children: ReactNode;
  className?: string | undefined;
}

/**
 * Shows the placeholder while loading, then the content in its place. The plain one swaps at once;
 * the motion add-on's twin crossfades the two in the same box.
 */
export function SkeletonSwap({ loading, fallback, children, className }: SkeletonSwapProps) {
  return (
    <div data-slot="skeleton-swap" aria-busy={loading || undefined} className={className}>
      {loading ? fallback : children}
    </div>
  );
}

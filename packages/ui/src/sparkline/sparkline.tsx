import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';

/** The chart tokens a sparkline can take; the same names as the charts' colours. */
export type SparklineColor =
  | 'series-1'
  | 'series-2'
  | 'series-3'
  | 'sequence-1'
  | 'sequence-2'
  | 'sequence-3'
  | 'sequence-4'
  | 'sequence-5'
  | 'reference';

const STROKE: Record<SparklineColor, string> = {
  'series-1': 'stroke-chart-series-1',
  'series-2': 'stroke-chart-series-2',
  'series-3': 'stroke-chart-series-3',
  'sequence-1': 'stroke-chart-sequence-1',
  'sequence-2': 'stroke-chart-sequence-2',
  'sequence-3': 'stroke-chart-sequence-3',
  'sequence-4': 'stroke-chart-sequence-4',
  'sequence-5': 'stroke-chart-sequence-5',
  reference: 'stroke-chart-reference',
};

const FILL: Record<SparklineColor, string> = {
  'series-1': 'fill-chart-series-1',
  'series-2': 'fill-chart-series-2',
  'series-3': 'fill-chart-series-3',
  'sequence-1': 'fill-chart-sequence-1',
  'sequence-2': 'fill-chart-sequence-2',
  'sequence-3': 'fill-chart-sequence-3',
  'sequence-4': 'fill-chart-sequence-4',
  'sequence-5': 'fill-chart-sequence-5',
  reference: 'fill-chart-reference',
};

const DOT: Record<SparklineColor, string> = {
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

export interface SparklineProps extends Omit<ComponentProps<'span'>, 'children'> {
  /** Figures oldest first. `null` leaves a gap. */
  data: readonly (number | null)[];
  color?: SparklineColor | undefined;
  /** Fill the area under the line, faintly. */
  area?: boolean | undefined;
  /** Mark the latest figure with a dot. On by default. */
  endDot?: boolean | undefined;
  /** A dashed line at this value, such as zero or a target, when it falls inside the range. */
  reference?: number | undefined;
  /**
   * Names the trend for assistive technology: `Revenue, rising over 12 months`. Without it the
   * sparkline is decorative and hidden, so say the trend in words beside it.
   */
  label?: string | undefined;
}

/** Points in a 100 by 100 box, y downwards, with a little room so the stroke is never cut. */
function layout(data: readonly (number | null)[], reference: number | undefined) {
  const known = data.filter((v): v is number => v !== null && Number.isFinite(v));
  const values = reference === undefined ? known : [...known, reference];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (index: number) => (data.length <= 1 ? 50 : (index / (data.length - 1)) * 100);
  const y = (value: number) => 92 - ((value - min) / span) * 84;
  return { x, y };
}

/**
 * A word-sized line of recent figures, for a stat, a table row or a card. Plain SVG: no chart
 * library, nothing to measure, and it scales to whatever box it is given.
 */
export function Sparkline({
  data,
  color = 'series-1',
  area = false,
  endDot = true,
  reference,
  label,
  className,
  ...props
}: SparklineProps) {
  const known = data.filter((v) => v !== null && Number.isFinite(v));
  const { x, y } = layout(data, reference);
  // One subpath per unbroken run, so a null leaves a real gap.
  const runs: { index: number; value: number }[][] = [];
  data.forEach((value, index) => {
    if (value === null || !Number.isFinite(value)) {
      runs.push([]);
      return;
    }
    const run = runs.at(-1);
    if (run === undefined) runs.push([{ index, value }]);
    else run.push({ index, value });
  });
  const segments = runs.filter((run) => run.length > 0);
  const line = segments
    .map((run) =>
      // A lone figure between gaps is drawn as a dot: a zero-length stroke with round caps.
      (run.length === 1 ? [...run, ...run] : run)
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.index).toFixed(2)},${y(p.value).toFixed(2)}`)
        .join(''),
    )
    .join('');
  const fill = segments
    .filter((run) => run.length > 1)
    .map((run) => {
      const first = run[0];
      const last = run.at(-1);
      if (first === undefined || last === undefined) return '';
      const top = run
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.index).toFixed(2)},${y(p.value).toFixed(2)}`)
        .join('');
      return `${top}L${x(last.index).toFixed(2)},100L${x(first.index).toFixed(2)},100Z`;
    })
    .join('');
  let lastIndex = -1;
  data.forEach((value, index) => {
    if (value !== null && Number.isFinite(value)) lastIndex = index;
  });
  const lastValue = data[lastIndex];
  const decorative = label === undefined;

  return (
    <span
      data-slot="sparkline"
      role={decorative ? undefined : 'img'}
      aria-label={label}
      aria-hidden={decorative || undefined}
      className={cn('relative inline-block h-8 w-24 shrink-0 align-middle', className)}
      {...props}
    >
      {known.length > 0 && (
        <svg
          data-part="line"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
        >
          {reference !== undefined && (
            <line
              x1={0}
              x2={100}
              y1={y(reference)}
              y2={y(reference)}
              strokeDasharray="3 3"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className="stroke-chart-baseline"
            />
          )}
          {area && fill !== '' && (
            <path d={fill} fillOpacity={0.14} stroke="none" className={FILL[color]} />
          )}
          <path
            d={line}
            fill="none"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={STROKE[color]}
          />
        </svg>
      )}
      {endDot && typeof lastValue === 'number' && (
        // An element, not an SVG circle, so it stays round in a stretched box.
        <span
          data-part="dot"
          aria-hidden
          className={cn(
            'absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-chart-halo',
            DOT[color],
          )}
          style={{ left: `${String(x(lastIndex))}%`, top: `${String(y(lastValue))}%` }}
        />
      )}
    </span>
  );
}

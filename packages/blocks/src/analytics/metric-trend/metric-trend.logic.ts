import { relativeChange } from '../../lib/finance';

/** A figure at a moment. `null` is a moment with no figure yet. */
export interface MetricPoint {
  date: Date;
  value: number | null;
}

export interface MetricFigures {
  /** The latest known figure. */
  latest: number;
  /** The first known figure in the range. */
  first: number;
  /** The change against `previous`, or against the first figure without it; null when either is zero. */
  change: number | null;
  /** Which way the range went, for words beside the line. */
  direction: 'up' | 'down' | 'flat';
  high: number;
  low: number;
}

/**
 * The figures a metric card writes: the latest value, its change and the range's high and low.
 * `previous` is the figure to compare against, such as the same metric a period ago; without it the
 * change runs from the first figure to the latest. Null when the range holds no figure at all.
 */
export function metricFigures(
  points: readonly MetricPoint[],
  previous?: number | null,
): MetricFigures | null {
  const known = [...points]
    .filter(
      (p): p is MetricPoint & { value: number } => p.value !== null && Number.isFinite(p.value),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstPoint = known[0];
  const lastPoint = known.at(-1);
  if (firstPoint === undefined || lastPoint === undefined) return null;
  const latest = lastPoint.value;
  const first = firstPoint.value;
  const base = previous ?? first;
  const change = relativeChange(latest, base);
  const values = known.map((p) => p.value);
  return {
    latest,
    first,
    change,
    direction: latest > base ? 'up' : latest < base ? 'down' : 'flat',
    high: Math.max(...values),
    low: Math.min(...values),
  };
}

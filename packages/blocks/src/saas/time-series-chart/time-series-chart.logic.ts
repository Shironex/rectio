import { extent, summarizeSeries, type TimeSeries } from '@rectio/ui/charts';

/** A series' latest figure and its change across the range, for the figures above the plot. */
export interface SeriesFigure {
  id: string;
  label: string;
  last: number;
  lastDate: Date;
  /** Relative change from the first point to the last; null when the first point is zero. */
  change: number | null;
}

/** The latest figure and the change of every series that has at least one point. */
export function seriesFigures(series: readonly TimeSeries[]): SeriesFigure[] {
  return series.flatMap((s) => {
    const summary = summarizeSeries(s.points);
    if (summary === null) return [];
    return [
      {
        id: s.id,
        label: s.label,
        last: summary.last.value,
        lastDate: summary.last.date,
        change: summary.change,
      },
    ];
  });
}

/** The first and last moment across every series, or null when there are no points. */
export function seriesRange(series: readonly TimeSeries[]): { from: Date; to: Date } | null {
  const times = series.flatMap((s) =>
    s.points.map((p) => p.date.getTime()).filter((time) => Number.isFinite(time)),
  );
  if (times.length === 0) return null;
  const { min, max } = extent(times);
  return { from: new Date(min), to: new Date(max) };
}

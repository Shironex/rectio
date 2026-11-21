import { relativeChange } from '../../lib/finance';

export interface TimePoint {
  date: Date;
  value: number;
}

export interface TimeSeries {
  /** Stable key, also the data key of the series in the chart. */
  id: string;
  label: string;
  /** One point per moment, in any order. A missing moment leaves a gap in the line. */
  points: readonly TimePoint[];
}

/** The step between points, which sets how the dates on the axis and in the table read. */
export type TimeScale = 'hour' | 'day' | 'month';

export interface TimeRow {
  time: number;
  date: Date;
  /** The value of each series at this moment, by series id; null where a series has no point. */
  values: Record<string, number | null>;
}

/** Every series' points on one timeline, in date order, one row per moment any series has. */
export function mergeSeries(series: readonly TimeSeries[]): TimeRow[] {
  const rows = new Map<number, TimeRow>();
  for (const s of series) {
    for (const point of s.points) {
      const time = point.date.getTime();
      const row = rows.get(time) ?? { time, date: point.date, values: {} };
      row.values[s.id] = point.value;
      rows.set(time, row);
    }
  }
  const sorted = [...rows.values()].sort((a, b) => a.time - b.time);
  for (const row of sorted) for (const s of series) row.values[s.id] ??= null;
  return sorted;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** The scale the points are on, from the smallest step between two of them. */
export function inferTimeScale(rows: readonly Pick<TimeRow, 'time'>[]): TimeScale {
  let step = Infinity;
  for (let index = 1; index < rows.length; index += 1) {
    const current = rows[index];
    const previous = rows[index - 1];
    if (current !== undefined && previous !== undefined) {
      step = Math.min(step, current.time - previous.time);
    }
  }
  if (step < DAY) return 'hour';
  if (step < 28 * DAY) return 'day';
  return 'month';
}

/** True when the rows run past a calendar year, so the axis has to name the year. */
function crossesYear(rows: readonly Pick<TimeRow, 'date'>[]): boolean {
  const first = rows[0];
  const last = rows.at(-1);
  return (
    first !== undefined &&
    last !== undefined &&
    first.date.getFullYear() !== last.date.getFullYear()
  );
}

/** A date for an axis tick: 14:00, 4 Mar, Mar or Mar 26, by scale. */
export function formatTick(
  date: Date,
  scale: TimeScale,
  locale: string | undefined,
  withYear = false,
): string {
  const options: Intl.DateTimeFormatOptions =
    scale === 'hour'
      ? { hour: 'numeric', minute: '2-digit' }
      : scale === 'day'
        ? { day: 'numeric', month: 'short' }
        : { month: 'short', ...(withYear ? { year: '2-digit' } : {}) };
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/** A date in full, for the tooltip and the table: 4 Mar 2026, 14:00 or March 2026. */
export function formatMoment(date: Date, scale: TimeScale, locale: string | undefined): string {
  const options: Intl.DateTimeFormatOptions =
    scale === 'hour'
      ? { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }
      : scale === 'day'
        ? { day: 'numeric', month: 'short', year: 'numeric' }
        : { month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Up to `count` evenly spread moments for the axis ticks, always the first and the last, so the
 * reader sees where the range starts and ends.
 */
export function pickTicks(rows: readonly Pick<TimeRow, 'time'>[], count = 6): number[] {
  if (rows.length <= count) return rows.map((row) => row.time);
  const step = (rows.length - 1) / (count - 1);
  const ticks = Array.from(
    { length: count },
    (_, index) => rows[Math.round(index * step)]?.time ?? 0,
  );
  return [...new Set(ticks)];
}

/** The tick labels need the year when the range crosses one. */
export function tickNeedsYear(rows: readonly Pick<TimeRow, 'date'>[], scale: TimeScale): boolean {
  return scale === 'month' && crossesYear(rows);
}

export interface SeriesSummary {
  id: string;
  label: string;
  first: TimePoint;
  last: TimePoint;
  peak: TimePoint;
  /** Relative change from the first point to the last; null when the first is zero. */
  change: number | null;
}

/** First, last and highest point of a series, and the change across it; null without points. */
export function summarizeSeries(series: TimeSeries): SeriesSummary | null {
  const points = [...series.points].sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = points[0];
  const last = points.at(-1);
  if (first === undefined || last === undefined) return null;
  const peak = points.reduce((top, point) => (point.value > top.value ? point : top), first);
  return {
    id: series.id,
    label: series.label,
    first,
    last,
    peak,
    change: relativeChange(last.value, first.value),
  };
}

import { relativeChange } from './chart-format';

export interface TimePoint {
  date: Date;
  /** The figure at that moment. `null` marks a known gap: the line breaks there. */
  value: number | null;
}

/** The step between points, which sets how dates read in the tooltip and the table. */
export type TimeScale = 'hour' | 'day' | 'month';

export interface TimeRow {
  time: number;
  date: Date;
  /** The value of each series at this moment, by series id; null where a series has no point. */
  values: Record<string, number | null>;
  /** A row added to break the line over missing moments; it never reaches the table. */
  gap?: boolean;
}

/** Every series' points on one timeline, in date order, one row per moment any series has. */
export function mergeSeries(
  series: readonly { id: string; points: readonly TimePoint[] }[],
): TimeRow[] {
  const rows = new Map<number, TimeRow>();
  for (const s of series) {
    for (const point of s.points) {
      const time = point.date.getTime();
      if (!Number.isFinite(time)) continue;
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

function smallestStep(rows: readonly Pick<TimeRow, 'time'>[]): number {
  let step = Infinity;
  for (let index = 1; index < rows.length; index += 1) {
    const current = rows[index];
    const previous = rows[index - 1];
    if (current !== undefined && previous !== undefined) {
      step = Math.min(step, current.time - previous.time);
    }
  }
  return step;
}

/** The scale the points are on, from the smallest step between two of them. */
export function inferTimeScale(rows: readonly Pick<TimeRow, 'time'>[]): TimeScale {
  const step = smallestStep(rows);
  if (step < DAY) return 'hour';
  if (step < 28 * DAY) return 'day';
  return 'month';
}

const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();

/**
 * Breaks the line where moments are missing: a run longer than three steps (a whole week missing
 * from daily figures, not a weekend) gets an empty row, so the line stops instead of drawing a
 * straight slope through days that have no figure.
 */
export function fillGaps(rows: readonly TimeRow[], scale: TimeScale): TimeRow[] {
  const step = smallestStep(rows);
  if (!Number.isFinite(step) || step <= 0) return [...rows];
  const out: TimeRow[] = [];
  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    if (previous !== undefined) {
      const missing =
        scale === 'month'
          ? monthIndex(row.date) - monthIndex(previous.date) > 1
          : row.time - previous.time > step * 3;
      if (missing) {
        const time = previous.time + Math.min(step, (row.time - previous.time) / 2);
        const values = Object.fromEntries(Object.keys(row.values).map((key) => [key, null]));
        out.push({ time, date: new Date(time), values, gap: true });
      }
    }
    out.push(row);
  });
  return out;
}

/** The unit the axis ticks fall on, which sets how each tick reads. */
export type TickUnit = 'hour' | 'day' | 'month';

interface TickStep {
  unit: TickUnit;
  size: number;
}

const STEPS: readonly TickStep[] = [
  { unit: 'hour', size: 1 },
  { unit: 'hour', size: 2 },
  { unit: 'hour', size: 3 },
  { unit: 'hour', size: 6 },
  { unit: 'hour', size: 12 },
  { unit: 'day', size: 1 },
  { unit: 'day', size: 2 },
  { unit: 'day', size: 7 },
  { unit: 'day', size: 14 },
  { unit: 'month', size: 1 },
  { unit: 'month', size: 2 },
  { unit: 'month', size: 3 },
  { unit: 'month', size: 6 },
  { unit: 'month', size: 12 },
  { unit: 'month', size: 24 },
];

/** Moments on round boundaries of one step, from the first at or after `start` up to `end`. */
function ticksOf(start: number, end: number, { unit, size }: TickStep): number[] {
  const first = new Date(start);
  const ticks: number[] = [];
  if (unit === 'month') {
    const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
    if (cursor.getTime() < start) cursor.setMonth(cursor.getMonth() + 1);
    // Steps of 3 land on quarters, 6 on halves, 12 on January.
    while (cursor.getMonth() % size !== 0) cursor.setMonth(cursor.getMonth() + 1);
    while (cursor.getTime() <= end) {
      ticks.push(cursor.getTime());
      cursor.setMonth(cursor.getMonth() + size);
    }
    return ticks;
  }
  if (unit === 'day') {
    const cursor = new Date(first.getFullYear(), first.getMonth(), first.getDate());
    if (cursor.getTime() < start) cursor.setDate(cursor.getDate() + 1);
    // Weekly steps start on a Monday, so the ticks read as weeks.
    if (size >= 7) while (cursor.getDay() !== 1) cursor.setDate(cursor.getDate() + 1);
    while (cursor.getTime() <= end) {
      ticks.push(cursor.getTime());
      cursor.setDate(cursor.getDate() + size);
    }
    return ticks;
  }
  const cursor = new Date(first.getFullYear(), first.getMonth(), first.getDate(), first.getHours());
  if (cursor.getTime() < start) cursor.setHours(cursor.getHours() + 1);
  while (cursor.getHours() % size !== 0) cursor.setHours(cursor.getHours() + 1);
  while (cursor.getTime() <= end) {
    ticks.push(cursor.getTime());
    cursor.setHours(cursor.getHours() + size);
  }
  return ticks;
}

export interface TimeTicks {
  ticks: number[];
  unit: TickUnit;
}

/**
 * Axis ticks on round calendar boundaries (every 6 hours, each Monday, each quarter), the finest
 * step that leaves at most `max` ticks. `max` comes from the plot's width, so a phone shows a few
 * dates and a wide screen more, never a crowd of labels.
 */
export function timeTicks(start: number, end: number, scale: TimeScale, max = 6): TimeTicks {
  const limit = Math.max(2, Math.floor(max));
  const smallest = scale === 'hour' ? 'hour' : scale === 'day' ? 'day' : 'month';
  const order: TickUnit[] = ['hour', 'day', 'month'];
  for (const step of STEPS) {
    if (order.indexOf(step.unit) < order.indexOf(smallest)) continue;
    const ticks = ticksOf(start, end, step);
    if (ticks.length >= 2 && ticks.length <= limit) return { ticks, unit: step.unit };
  }
  return { ticks: end > start ? [start, end] : [start], unit: smallest };
}

/**
 * A tick's label by the unit the ticks fall on: 14:00, 4 Mar, Mar. A month tick names its year in
 * January and on the first tick when the range crosses a year, so the reader never loses the year.
 */
export function formatTick(
  time: number,
  unit: TickUnit,
  locale: string | undefined,
  {
    first = false,
    crossesYear: yearCrossed = false,
  }: { first?: boolean; crossesYear?: boolean } = {},
): string {
  const date = new Date(time);
  if (unit === 'hour') {
    // Midnight names the day, so a range of days shows where each one starts.
    const options: Intl.DateTimeFormatOptions =
      date.getHours() === 0
        ? { day: 'numeric', month: 'short' }
        : { hour: '2-digit', minute: '2-digit' };
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
  if (unit === 'day') {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
  }
  const withYear = yearCrossed && (first || date.getMonth() === 0);
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(date);
}

/** A moment in full, for the tooltip, the summary and the table: 4 Mar 2026, 14:00 or March 2026. */
export function formatMoment(date: Date, scale: TimeScale, locale: string | undefined): string {
  const options: Intl.DateTimeFormatOptions =
    scale === 'hour'
      ? { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }
      : scale === 'day'
        ? { day: 'numeric', month: 'short', year: 'numeric' }
        : { month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/** True when the rows start and end in different calendar years. */
export function crossesYear(rows: readonly Pick<TimeRow, 'date'>[]): boolean {
  const first = rows[0];
  const last = rows.at(-1);
  return (
    first !== undefined &&
    last !== undefined &&
    first.date.getFullYear() !== last.date.getFullYear()
  );
}

export interface SeriesSummary {
  first: { date: Date; value: number };
  last: { date: Date; value: number };
  peak: { date: Date; value: number };
  low: { date: Date; value: number };
  /** Relative change from the first point to the last; null when the first is zero. */
  change: number | null;
}

/** First, last, highest and lowest point of a series and the change across it; null without points. */
export function summarizeSeries(points: readonly TimePoint[]): SeriesSummary | null {
  const known = points
    .filter((p): p is { date: Date; value: number } => p.value !== null && Number.isFinite(p.value))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = known[0];
  const last = known.at(-1);
  if (first === undefined || last === undefined) return null;
  const peak = known.reduce((top, point) => (point.value > top.value ? point : top), first);
  const low = known.reduce((bottom, point) => (point.value < bottom.value ? point : bottom), first);
  return { first, last, peak, low, change: relativeChange(last.value, first.value) };
}

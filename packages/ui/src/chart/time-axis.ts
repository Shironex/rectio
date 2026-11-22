import { relativeChange } from './chart-format';

export interface TimePoint {
  /**
   * The moment, in the reader's local time. A date-only ISO string such as '2026-03-01' parses as
   * UTC midnight, which is the evening before west of UTC: build it with `localDate` instead.
   */
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

/**
 * The scale the points are on, from the smallest step between two of them. A daily step is 23 or
 * 25 hours across a daylight saving change, so anything from 20 hours up counts as a day.
 */
export function inferTimeScale(rows: readonly Pick<TimeRow, 'time'>[]): TimeScale {
  const step = smallestStep(rows);
  if (step < 20 * HOUR) return 'hour';
  if (step < 28 * DAY) return 'day';
  return 'month';
}

// Kept here for the charts entry, which has always exported it; it lives with the plain helpers.
export { localDate } from '../lib/local-date';

/** The calendar day a moment falls on, as a whole number that steps by one a day in any zone. */
const dayNumber = (date: Date) =>
  Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY);

/**
 * The smallest step between two rows in calendar days: 1 for daily figures, 7 for weekly ones,
 * whatever the clock changes in between. Infinity with fewer than two rows.
 */
export function smallestDayStep(rows: readonly Pick<TimeRow, 'date'>[]): number {
  let step = Infinity;
  for (let index = 1; index < rows.length; index += 1) {
    const current = rows[index];
    const previous = rows[index - 1];
    if (current === undefined || previous === undefined) continue;
    const days = dayNumber(current.date) - dayNumber(previous.date);
    if (days > 0 && days < step) step = days;
  }
  return step;
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
  // Daily rows are measured in calendar days, so a weekend across a clock change is not a gap.
  const dayStep = Math.max(1, smallestDayStep(rows));
  const out: TimeRow[] = [];
  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    if (previous !== undefined) {
      const missing =
        scale === 'month'
          ? monthIndex(row.date) - monthIndex(previous.date) > 1
          : scale === 'day'
            ? dayNumber(row.date) - dayNumber(previous.date) > dayStep * 3
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

/** Monday 00:00 of the week a date falls in, in local time. */
function weekStart(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

/**
 * Daily rows as one row per week (weeks start on Monday), each series' value the mean of its days
 * that week. Every week from the first to the last has a row: a week with no figure for a series
 * is null for it, and a week with no figure at all is a gap row, so the line breaks there and a
 * missing month never draws as a straight slope. A shorter missing stretch (a gap row from
 * `fillGaps`) still breaks the line after the week it starts in. For a plot too narrow to show
 * every day.
 */
export function weeklyMeans(rows: readonly TimeRow[]): TimeRow[] {
  const known = rows.filter((row) => row.gap !== true);
  const first = known[0];
  const last = known.at(-1);
  if (first === undefined || last === undefined) return [];
  const keys = Object.keys(first.values);
  const sums = new Map<number, Map<string, [number, number]>>();
  // Weeks a missing stretch starts in: the line breaks after them, even when the stretch is a few
  // days split over two weeks that both still have figures.
  const breaks = new Set(
    rows.filter((row) => row.gap === true).map((row) => weekStart(row.date).getTime()),
  );
  for (const row of known) {
    const time = weekStart(row.date).getTime();
    const week = sums.get(time) ?? new Map<string, [number, number]>();
    for (const [key, value] of Object.entries(row.values)) {
      const [sum, count] = week.get(key) ?? [0, 0];
      week.set(key, value === null ? [sum, count] : [sum + value, count + 1]);
    }
    sums.set(time, week);
  }
  const out: TimeRow[] = [];
  // Step by calendar weeks, so a clock change never shifts a week off its Monday.
  for (
    const cursor = weekStart(first.date);
    cursor.getTime() <= last.time;
    cursor.setDate(cursor.getDate() + 7)
  ) {
    const date = new Date(cursor);
    const week = sums.get(date.getTime());
    const values = Object.fromEntries(
      keys.map((key) => {
        const [sum, count] = week?.get(key) ?? [0, 0];
        return [key, count === 0 ? null : sum / count];
      }),
    );
    const empty = Object.values(values).every((value) => value === null);
    out.push({ time: date.getTime(), date, values, ...(empty ? { gap: true } : {}) });
    const next = new Date(date);
    next.setDate(next.getDate() + 7);
    // Only where the next week has figures: an empty next week is a gap row already.
    if (!empty && breaks.has(date.getTime()) && sums.has(next.getTime())) {
      // Half a week on, between this week's point and the next: the line stops there.
      const time = date.getTime() + 3.5 * DAY;
      const nulls = Object.fromEntries(keys.map((key) => [key, null]));
      out.push({ time, date: new Date(time), values: nulls, gap: true });
    }
  }
  return out;
}

/** True when some moments are missing between the first and the last row. */
export function hasGaps(rows: readonly TimeRow[]): boolean {
  return rows.some((row) => row.gap === true);
}

/**
 * The stretches a run of gap rows breaks: from the last moment before the run to the first one
 * after it, one span per run.
 */
export function gapSpans(rows: readonly TimeRow[]): { from: number; to: number }[] {
  const spans: { from: number; to: number }[] = [];
  let from: number | undefined;
  rows.forEach((row, index) => {
    if (row.gap === true) {
      from ??= rows[index - 1]?.time;
      return;
    }
    if (from !== undefined) spans.push({ from, to: row.time });
    from = undefined;
  });
  return spans;
}

import { isWorkingDay, toIsoDay, weekOf, type IsoDay, type WorkCalendar } from '../lib/days';

/**
 * The timesheet's sums and flags. Time is whole minutes from end to end: a cell holds an integer,
 * every total is a sum of integers, so seven days of 7.33 hours never drift into 51.309999. Hours
 * are only a way of writing minutes, parsed in and formatted out at the edge. Server safe.
 */

/** Where a week is in its review. A rejected week is open again, with the approver's reason. */
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface TimesheetRow {
  id: string;
  /** The project, client or cost centre the time goes to. */
  project: string;
  /** The task or activity under it, written under the project. */
  task?: string | undefined;
  /** Minutes worked per day. A missing day is zero. */
  minutes: Readonly<Record<IsoDay, number>>;
  /** A note per day, such as what was done or why a day ran long. */
  notes?: Readonly<Record<IsoDay, string>> | undefined;
}

/** What a day of the week needs a second look for. */
export type DayFlag = 'over' | 'short' | 'missing';

export interface TimesheetDay {
  day: IsoDay;
  /** Minutes on every row that day. */
  total: number;
  /** Minutes a working day expects; 0 on a weekend or a holiday. */
  expected: number;
  /** The holiday's name, `weekend`, or null on a working day. */
  off: string | null;
  flag: DayFlag | null;
}

export interface TimesheetTotals {
  days: TimesheetDay[];
  /** Minutes per row, by row id. */
  rows: Record<string, number>;
  week: number;
  expectedWeek: number;
  /** Minutes past the week's expected total; 0 when under it. */
  overtime: number;
  /** Past working days with no time at all. */
  missing: IsoDay[];
}

export interface TimesheetOptions extends WorkCalendar {
  /** Minutes a working day expects. 480 (8 hours) by default. */
  dailyMinutes?: number | undefined;
  /**
   * Today, for the missing and short flags: only days before it count, so a week in progress is not
   * flagged for days still to come. The current date by default.
   */
  today?: IsoDay | undefined;
}

export const MAX_DAY_MINUTES = 24 * 60;

/** A cell's minutes as the sums read them: a whole number from 0 to a day, else 0. */
export function cellMinutes(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.min(MAX_DAY_MINUTES, Math.max(0, Math.round(value)));
}

/** Row, day and week totals with each day's flag. */
export function timesheetTotals(
  rows: readonly TimesheetRow[],
  weekStart: IsoDay,
  { dailyMinutes = 480, today = toIsoDay(new Date()), ...calendar }: TimesheetOptions = {},
): TimesheetTotals {
  const week = weekOf(weekStart);
  const byRow: Record<string, number> = {};
  const byDay = new Map<IsoDay, number>(week.map((day) => [day, 0]));
  for (const row of rows) {
    let sum = 0;
    for (const day of week) {
      const minutes = cellMinutes(row.minutes[day]);
      sum += minutes;
      byDay.set(day, (byDay.get(day) ?? 0) + minutes);
    }
    byRow[row.id] = sum;
  }
  const days = week.map((day): TimesheetDay => {
    const total = byDay.get(day) ?? 0;
    const working = isWorkingDay(day, calendar);
    const expected = working ? dailyMinutes : 0;
    const past = day < today;
    const flag: DayFlag | null =
      total > expected
        ? 'over'
        : working && past && total === 0
          ? 'missing'
          : working && past && total < expected
            ? 'short'
            : null;
    return {
      day,
      total,
      expected,
      off: working ? null : (calendar.holidays?.[day] ?? 'weekend'),
      flag,
    };
  });
  const total = days.reduce((sum, day) => sum + day.total, 0);
  const expectedWeek = days.reduce((sum, day) => sum + day.expected, 0);
  return {
    days,
    rows: byRow,
    week: total,
    expectedWeek,
    overtime: Math.max(0, total - expectedWeek),
    missing: days.filter((day) => day.flag === 'missing').map((day) => day.day),
  };
}

/** True while the person can change the week: a draft or a rejected week that is not locked. */
export function isEditable(status: TimesheetStatus, locked = false): boolean {
  return !locked && (status === 'draft' || status === 'rejected');
}

/** How a cell takes and shows time: decimal hours (7.5) or hours and minutes (7:30). */
export type TimeEntry = 'decimal' | 'clock';

export type DurationParse =
  { ok: true; minutes: number | null } | { ok: false; reason: 'invalid' | 'too-long' };

/**
 * Typed time to whole minutes. Takes decimal hours with a point or a comma (`7.5`, `7,5`), hours
 * and minutes (`7:30`), and units (`7h 30m`, `45m`, `2h`). Empty clears the cell (null). More than
 * a day, a negative or anything else is refused with the reason.
 */
export function parseDuration(text: string): DurationParse {
  const value = text.trim().toLowerCase().replace(/\s+/g, ' ');
  if (value === '') return { ok: true, minutes: null };
  let minutes: number | null = null;
  const clock = /^(\d{1,2}):(\d{2})$/.exec(value);
  const units = /^(?:(\d+(?:[.,]\d+)?) ?h(?:ours?|rs?)?)? ?(?:(\d+) ?m(?:in(?:utes?)?)?)?$/.exec(
    value,
  );
  if (clock !== null) {
    const mins = Number(clock[2]);
    if (mins < 60) minutes = Number(clock[1]) * 60 + mins;
  } else if (/^\d*(?:[.,]\d+)?$/.test(value) && /\d/.test(value)) {
    minutes = Number(value.replace(',', '.')) * 60;
  } else if (units !== null && (units[1] !== undefined || units[2] !== undefined)) {
    minutes = Number((units[1] ?? '0').replace(',', '.')) * 60 + Number(units[2] ?? '0');
  }
  if (minutes === null || !Number.isFinite(minutes)) return { ok: false, reason: 'invalid' };
  const whole = Math.round(minutes);
  if (whole > MAX_DAY_MINUTES) return { ok: false, reason: 'too-long' };
  return { ok: true, minutes: whole };
}

const decimalCache = new Map<string, Intl.NumberFormat>();

/**
 * Minutes written as the entry reads them: `7.5` or `7,5` in decimal hours (up to two places, so
 * 20 minutes is 0.33), `7:30` in clock form. Zero is an empty string in a cell, so the grid shows
 * what was entered rather than a wall of zeros; pass `zero` to write it.
 */
export function formatDuration(
  minutes: number,
  locale: string,
  entry: TimeEntry = 'decimal',
  { zero = false }: { zero?: boolean } = {},
): string {
  if (minutes === 0 && !zero) return '';
  if (entry === 'clock') {
    return `${String(Math.floor(minutes / 60))}:${String(minutes % 60).padStart(2, '0')}`;
  }
  let format = decimalCache.get(locale);
  if (format === undefined) {
    format = new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false });
    decimalCache.set(locale, format);
  }
  return format.format(minutes / 60);
}

/**
 * Calendar days for the people blocks, as `YYYY-MM-DD` strings. A day string has no clock and no
 * zone, so a week that crosses a clock change still has seven days of 24 hours each: the arithmetic
 * runs on UTC midnights and never touches the local clock. Turn a day into a local Date for display
 * with `localDate` from `@rectio/ui`. Server safe.
 */

/** A calendar day, such as `2026-11-23`. */
export type IsoDay = string;

const DAY_MS = 86_400_000;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** UTC midnight of a day string, or NaN when it is not one. */
function utc(day: IsoDay): number {
  const match = ISO.exec(day);
  if (match === null) return Number.NaN;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function fromUtc(ms: number): IsoDay {
  const date = new Date(ms);
  return `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

/** True for a real calendar day in the `YYYY-MM-DD` form (2026-02-30 is not one). */
export function isIsoDay(day: string): day is IsoDay {
  const ms = utc(day);
  return !Number.isNaN(ms) && fromUtc(ms) === day;
}

/** The local calendar day of a Date: today's date where the reader is, not in UTC. */
export function toIsoDay(date: Date): IsoDay {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** The day `count` days after (or before, when negative) `day`. */
export function addDays(day: IsoDay, count: number): IsoDay {
  return fromUtc(utc(day) + count * DAY_MS);
}

/** Whole days from `from` to `to`: 1 from Monday to Tuesday, negative when `to` is earlier. */
export function daysFrom(from: IsoDay, to: IsoDay): number {
  return Math.round((utc(to) - utc(from)) / DAY_MS);
}

/** Day of the week, 0 for Sunday to 6 for Saturday, as `Date.getDay` counts. */
export function weekday(day: IsoDay): number {
  return new Date(utc(day)).getUTCDay();
}

/** The days from `start` up to, not including, `end`: the exclusive end the scheduling blocks use. */
export function daysBetween(start: IsoDay, end: IsoDay): IsoDay[] {
  const count = daysFrom(start, end);
  return Array.from({ length: Math.max(0, count) }, (_, index) => addDays(start, index));
}

/** The seven days of the week that starts on `start`. */
export function weekOf(start: IsoDay): IsoDay[] {
  return daysBetween(start, addDays(start, 7));
}

/**
 * The first day of the week holding `day`, with weeks starting on `firstDay` (1, Monday, by
 * default; 0 for Sunday).
 */
export function startOfWeek(day: IsoDay, firstDay = 1): IsoDay {
  return addDays(day, -((weekday(day) - firstDay + 7) % 7));
}

/** Saturday and Sunday, the default weekend. */
export const WEEKEND: readonly number[] = [0, 6];

export interface WorkCalendar {
  /** Days of the week nobody works, 0 for Sunday. Saturday and Sunday by default. */
  weekend?: readonly number[] | undefined;
  /** Public holidays and office closures: the day and its name. */
  holidays?: Readonly<Record<IsoDay, string>> | undefined;
}

/** True when `day` is a working day: not in the weekend and not a holiday. */
export function isWorkingDay(day: IsoDay, calendar: WorkCalendar = {}): boolean {
  const weekend = calendar.weekend ?? WEEKEND;
  return !weekend.includes(weekday(day)) && calendar.holidays?.[day] === undefined;
}

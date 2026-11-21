/**
 * Time of day without a date, the value of TimeField: `hour` 0 to 23, `minute` 0 to 59. Pure
 * helpers, so a server can format and check the same values.
 */
export interface TimeValue {
  hour: number;
  minute: number;
}

/** A clock face: 12 hours with a day period (AM and PM), or 24 hours. */
export type HourCycle = 12 | 24;

export type TimeSegment = 'hour' | 'minute' | 'period';

/** Minutes since midnight. */
export function timeToMinutes({ hour, minute }: TimeValue): number {
  return hour * 60 + minute;
}

/** A time from minutes since midnight, wrapping past the end of the day. */
export function minutesToTime(minutes: number): TimeValue {
  const day = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return { hour: Math.floor(day / 60), minute: day % 60 };
}

/** `09:30`, the form a time input and a hidden form field carry. */
export function formatIsoTime({ hour, minute }: TimeValue): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** `09:30` or `9:30` to a time, or null when it is not one. */
export function parseIsoTime(text: string): TimeValue | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (match === null) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

/**
 * The clock the locale reads: 12 hours for en-US, 24 for en-GB, pl-PL and de-DE. From Intl, so
 * every locale the runtime knows answers for itself.
 */
export function resolveHourCycle(locale?: string): HourCycle {
  const cycle = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
  return cycle === 'h11' || cycle === 'h12' ? 12 : 24;
}

/** The locale's own words for the day periods, such as AM and PM, or vorm. and nachm. */
export function dayPeriodNames(locale?: string): [am: string, pm: string] {
  const format = new Intl.DateTimeFormat(locale, { hour: 'numeric', hourCycle: 'h12' });
  const name = (hour: number) =>
    format.formatToParts(new Date(2026, 0, 1, hour)).find((part) => part.type === 'dayPeriod')
      ?.value ?? (hour < 12 ? 'AM' : 'PM');
  return [name(9), name(21)];
}

/** A time as the locale writes it, such as 9:30 AM or 09:30. */
export function formatTime(value: TimeValue, locale?: string, hourCycle?: HourCycle): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    ...(hourCycle === undefined ? {} : { hourCycle: hourCycle === 12 ? 'h12' : 'h23' }),
  }).format(new Date(2026, 0, 1, value.hour, value.minute));
}

/** True when the time is inside the bounds, both ends included. */
export function isTimeInRange(value: TimeValue, min?: TimeValue, max?: TimeValue): boolean {
  const at = timeToMinutes(value);
  return (
    (min === undefined || at >= timeToMinutes(min)) &&
    (max === undefined || at <= timeToMinutes(max))
  );
}

/** The time moved inside the bounds. */
export function clampTime(value: TimeValue, min?: TimeValue, max?: TimeValue): TimeValue {
  const at = timeToMinutes(value);
  if (min !== undefined && at < timeToMinutes(min)) return min;
  if (max !== undefined && at > timeToMinutes(max)) return max;
  return value;
}

/** The hour as a 12 hour face shows it (12, 1 to 11) and whether it is after noon. */
export function toTwelveHour(hour: number): { hour: number; pm: boolean } {
  return { hour: hour % 12 === 0 ? 12 : hour % 12, pm: hour >= 12 };
}

/** A 12 hour face's hour and period back to 0 to 23. */
export function fromTwelveHour(hour: number, pm: boolean): number {
  return (hour % 12) + (pm ? 12 : 0);
}

/** One minute value a step further, landing on a multiple of the step. Wraps within the hour. */
function stepMinute(minute: number, delta: number, step: number): number {
  const steps = Math.ceil(60 / step);
  const index =
    delta > 0
      ? Math.floor(minute / step) + delta
      : // Down from between two marks lands on the lower mark first.
        Math.ceil(minute / step) + delta;
  return (((index % steps) + steps) % steps) * step;
}

export interface StepOptions {
  /** Minutes between the marks the minute segment steps to. */
  step?: number;
  hourCycle?: HourCycle;
}

/**
 * The time after pressing an arrow (`delta` 1 or -1) or Page Up and Down (a larger delta) on one
 * segment. Each segment wraps on its own, the way a clock's hands are set: minutes do not carry
 * into the hour, and on a 12 hour face the hour keeps its period. The period segment flips.
 */
export function stepTime(
  value: TimeValue,
  segment: TimeSegment,
  delta: number,
  { step = 1, hourCycle = 24 }: StepOptions = {},
): TimeValue {
  if (segment === 'minute') return { ...value, minute: stepMinute(value.minute, delta, step) };
  if (segment === 'period') return { ...value, hour: (value.hour + 12) % 24 };
  if (hourCycle === 24) return { ...value, hour: (((value.hour + delta) % 24) + 24) % 24 };
  const { hour, pm } = toTwelveHour(value.hour);
  const next = ((((hour % 12) + delta) % 12) + 12) % 12;
  return { ...value, hour: fromTwelveHour(next, pm) };
}

/** What one typed digit does to a segment. */
export interface TypedDigit {
  /** The segment's new number, as the face shows it (1 to 12 on a 12 hour face). */
  value: number;
  /** The digits typed so far, kept while a second digit could still follow. */
  buffer: string;
  /** True when the segment is complete and focus should move on. */
  advance: boolean;
}

/**
 * Types one digit into the hour or the minute. A digit that cannot start a two digit number (3 to
 * 9 for a 24 hour hour, 2 to 9 on a 12 hour face, 6 to 9 for minutes) completes the segment at
 * once; otherwise a second digit follows. A pair that is out of range starts over with the new digit.
 */
export function typeDigit(
  buffer: string,
  digit: string,
  segment: 'hour' | 'minute',
  hourCycle: HourCycle = 24,
): TypedDigit {
  const max = segment === 'minute' ? 59 : hourCycle === 24 ? 23 : 12;
  const firstMax = Math.floor(max / 10);
  const pair = Number(buffer + digit);
  if (buffer !== '' && pair <= max && !(segment === 'hour' && hourCycle === 12 && pair === 0)) {
    return { value: pair, buffer: '', advance: true };
  }
  const single = Number(digit);
  if (single > firstMax) return { value: single, buffer: '', advance: true };
  // A lone 0 on a 12 hour face is not an hour yet: it waits for the second digit.
  const shown = segment === 'hour' && hourCycle === 12 && single === 0 ? 12 : single;
  return { value: shown, buffer: digit, advance: false };
}

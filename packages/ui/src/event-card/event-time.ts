import { resolveHourCycle } from '../time-field/time';

/**
 * One formatter per locale and kind, made on first use: a week of event cards would otherwise
 * build several Intl formatters per card on every render.
 */
const formatters = new Map<string, Intl.DateTimeFormat | Intl.NumberFormat>();

function cached<T extends Intl.DateTimeFormat | Intl.NumberFormat>(key: string, make: () => T): T {
  const found = formatters.get(key);
  if (found !== undefined) return found as T;
  const made = make();
  formatters.set(key, made);
  return made;
}

const dayFormat = (locale?: string) =>
  cached(
    `day:${locale ?? ''}`,
    () => new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }),
  );

// A 24 hour clock writes 09:00, as the time field does; a 12 hour one writes 9:00 AM.
const timeFormat = (locale?: string) =>
  cached(
    `time:${locale ?? ''}`,
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: resolveHourCycle(locale) === 24 ? '2-digit' : 'numeric',
        minute: '2-digit',
      }),
  );

const unitFormat = (locale: string | undefined, unit: 'minute' | 'hour' | 'day') =>
  cached(
    `unit:${unit}:${locale ?? ''}`,
    () => new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'short' }),
  );

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** The day after, on the calendar: 24 hours, or 23 or 25 across a clock change. */
const nextDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

/**
 * When an event happens, as words: `09:00 to 10:30`, `9:00 AM to 10:30 AM`, `All day`, or with the
 * days written when it runs past midnight: `Mon 16 Mar, 22:00 to Tue 17 Mar, 01:00`.
 */
export function formatEventTime(start: Date, end: Date, locale?: string, allDay = false): string {
  if (allDay) {
    // An all-day end is exclusive or the same day; either way the last day is the one before it ends.
    const last = new Date(end.getTime() - 1);
    return end.getTime() <= nextDay(start).getTime() || sameDay(start, last)
      ? 'All day'
      : `${dayFormat(locale).format(start)} to ${dayFormat(locale).format(last)}`;
  }
  const time = timeFormat(locale);
  const day = dayFormat(locale);
  return sameDay(start, end)
    ? `${time.format(start)} to ${time.format(end)}`
    : `${day.format(start)}, ${time.format(start)} to ${day.format(end)}, ${time.format(end)}`;
}

/** When an event starts, on the locale's clock: `09:00` or `9:00 AM`. */
export function formatEventStart(start: Date, locale?: string): string {
  return timeFormat(locale).format(start);
}

/** How long an event lasts, short: `45 min`, `1 hr 30 min`, `3 days`. */
export function formatEventLength(start: Date, end: Date, locale?: string): string {
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
  const unit = (value: number, name: 'minute' | 'hour' | 'day') =>
    unitFormat(locale, name).format(value);
  if (minutes >= 1440 && minutes % 1440 === 0) return unit(minutes / 1440, 'day');
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return unit(rest, 'minute');
  return rest === 0 ? unit(hours, 'hour') : `${unit(hours, 'hour')} ${unit(rest, 'minute')}`;
}

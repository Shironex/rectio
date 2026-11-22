import { localDate } from '@rectio/ui';

import { addDays, type IsoDay } from './days';

/**
 * Locale formatting the people blocks share: days, ranges of days and counts that can be halves.
 * Intl formatters are cached per locale and pattern. Server safe.
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = formatters.get(key);
  if (format === undefined) {
    format = new Intl.DateTimeFormat(locale, options);
    formatters.set(key, format);
  }
  return format;
}

/** `Mon 23 Nov`, `Mon, Nov 23`: a day in a list or a column head. */
export function formatDay(day: IsoDay, locale: string): string {
  return dateFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(
    localDate(day),
  );
}

/** `23 Nov`: a day in running text, such as when a decision was made. */
export function formatDate(day: IsoDay, locale: string): string {
  return dateFormat(locale, { day: 'numeric', month: 'short' }).format(localDate(day));
}

/** `Monday 23 November 2026`: a day named in full, for labels read aloud. */
export function formatDayLong(day: IsoDay, locale: string): string {
  return dateFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(localDate(day));
}

/** `Mon`: the weekday alone. */
export function formatWeekday(day: IsoDay, locale: string): string {
  return dateFormat(locale, { weekday: 'short' }).format(localDate(day));
}

/** `23`: the day of the month alone. */
export function formatDayNumber(day: IsoDay, locale: string): string {
  return dateFormat(locale, { day: 'numeric' }).format(localDate(day));
}

/**
 * The days from `start` to the day before `end` (an exclusive end): `23 Nov 2026` for one day, else
 * the first and last day handed to `join`, the first without its year when both share one. English
 * joins with "to", as the date picker does: `23 Nov to 27 Nov 2026`.
 */
export function formatDayRange(
  start: IsoDay,
  end: IsoDay,
  locale: string,
  join: (first: string, last: string) => string = (first, last) => `${first} to ${last}`,
): string {
  const last = addDays(end, -1);
  const full = dateFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  if (last <= start) return full.format(localDate(start));
  const sameYear = start.slice(0, 4) === last.slice(0, 4);
  const first = sameYear
    ? dateFormat(locale, { day: 'numeric', month: 'short' }).format(localDate(start))
    : full.format(localDate(start));
  return join(first, full.format(localDate(last)));
}

/** A count of days that can end in a half: `3`, `3.5`, `3,5`. */
export function formatDays(halves: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(halves / 2);
}

import type { DayPickerLocale } from '@daypicker/react';
import { format, isValid, parse } from 'date-fns';

/** Reading and writing the dates a date field shows. Plain functions, so a server can run them. */

/**
 * The locale's short date pattern, written the way people read it: `dd/mm/yyyy`, `dd.mm.yyyy`.
 * Read from a formatted sample date, so the order and separators are exactly what parsing expects.
 */
export function datePattern(dateLocale: DayPickerLocale): string {
  return format(new Date(2026, 11, 31), 'P', { locale: dateLocale })
    .replace('2026', 'yyyy')
    .replace('31', 'dd')
    .replace('12', 'mm');
}

/**
 * How a date field shows its date: a date-fns pattern such as `'d MMM yyyy'` (31 Dec 2026) or
 * `'PP'` (the locale's medium date), or a function of the date and the locale. Default `'P'`, the
 * locale's short date, such as 31/12/2026.
 */
export type DateDisplayFormat = string | ((date: Date, dateLocale: DayPickerLocale) => string);

/**
 * Typed text to a date, or null. Reads the field's own pattern first, then the locale's short
 * pattern, so `31/12/2026` still works in a field that shows `31 Dec 2026`. Four-digit years only.
 */
export function parseDate(
  text: string,
  dateLocale: DayPickerLocale,
  displayFormat: DateDisplayFormat = 'P',
): Date | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const patterns = typeof displayFormat === 'string' ? [displayFormat, 'P'] : ['P'];
  for (const pattern of patterns) {
    const parsed = parse(trimmed, pattern, new Date(), { locale: dateLocale });
    if (isValid(parsed) && parsed.getFullYear() >= 1000) return parsed;
  }
  return null;
}

/** A date as the field shows it. */
export function formatDisplayDate(
  date: Date,
  dateLocale: DayPickerLocale,
  displayFormat: DateDisplayFormat = 'P',
): string {
  return typeof displayFormat === 'function'
    ? displayFormat(date, dateLocale)
    : format(date, displayFormat, { locale: dateLocale });
}

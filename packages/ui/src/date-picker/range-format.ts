import type { DayPickerLocale } from '@daypicker/react';
import { differenceInCalendarDays, format } from 'date-fns';

/** `12 Mar to 18 Mar 2026`, the dates a preset or a summary writes out. */
export function formatDateRange(
  { from, to }: { from: Date; to: Date },
  dateLocale: DayPickerLocale,
): string {
  const sameYear = from.getFullYear() === to.getFullYear();
  return `${format(from, sameYear ? 'd MMM' : 'd MMM yyyy', { locale: dateLocale })} to ${format(to, 'd MMM yyyy', { locale: dateLocale })}`;
}

/** Days a range covers, both ends included: 12 to 18 March is 7 days. */
export function rangeLength({ from, to }: { from: Date; to: Date }): number {
  return Math.abs(differenceInCalendarDays(to, from)) + 1;
}

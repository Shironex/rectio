/**
 * A local calendar date from 'YYYY-MM-DD', at local midnight; Invalid Date for anything else.
 * `new Date('2026-03-16')` is UTC midnight, the evening before west of UTC: build the days of
 * charts, all-day events and agendas with this instead.
 */
export function localDate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (match === null) return new Date(Number.NaN);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

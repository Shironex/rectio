/**
 * The company the app runs for, and how it formats money and dates. Replace these with the
 * signed-in organisation's settings once you wire a backend.
 */
export const COMPANY = {
  name: 'Fernhill Systems',
  legalName: 'Fernhill Systems Ltd',
  initial: 'F',
  address: ['14 Harcourt Street', 'Dublin D02 YX88', 'Ireland'],
  taxId: 'IE 3412876LH',
  registration: 'CRO 618204',
  email: 'accounts@fernhill.ie',
  iban: 'IE29 AIBK 9311 5212 3456 78',
  bic: 'AIBKIE2D',
} as const;

/** Every amount in the sample data is in this currency, in major units (12.5 is 12.50 EUR). */
export const CURRENCY = 'EUR';
export const LOCALE = 'en-IE';

/** The day the sample data is written against: Thursday 19 November 2026. */
export const TODAY = new Date(2026, 10, 19);

/** A calendar date, months counted from 1 as people write them. */
export function day(year: number, month: number, date: number): Date {
  return new Date(year, month - 1, date);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** The signed-in user. */
export const CURRENT_USER = {
  name: 'Niamh Walsh',
  email: 'niamh.walsh@fernhill.ie',
  role: 'Finance lead',
} as const;

const longDate = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long' });
const shortDate = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });
const monthYear = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
const time = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });

export const formatLongDate = (date: Date) => longDate.format(date);
export const formatShortDate = (date: Date) => shortDate.format(date);
export const formatMonth = (date: Date) => monthYear.format(date);
export const formatTime = (date: Date) => time.format(date);

/** A date as an ISO day, for `<time dateTime>`. */
export function isoDay(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${String(date.getFullYear())}-${m}-${d}`;
}

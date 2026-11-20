/**
 * The product, the workspace the app runs for and how it formats dates and numbers. Replace these
 * with the signed-in workspace's settings once you wire a backend.
 */
export const PRODUCT = {
  name: 'Lindwell',
  tagline: 'The help desk for teams that answer every customer by name.',
} as const;

/** The workspace is the support team of Copperline, a scheduling app for trades businesses. */
export const WORKSPACE = {
  name: 'Copperline',
  initial: 'C',
  subdomain: 'copperline',
  helpCenter: 'help.copperline.app',
  plan: 'Business',
} as const;

export const LOCALE = 'en-US';
export const CURRENCY = 'USD';

/** The moment the sample data is written against: Thursday 19 November 2026, 10:42. */
export const NOW = new Date(2026, 10, 19, 10, 42);
export const TODAY = new Date(2026, 10, 19);

/** A calendar date and time, months counted from 1 as people write them. */
export function at(month: number, date: number, hour = 9, minute = 0, year = 2026): Date {
  return new Date(year, month - 1, date, hour, minute);
}

/** A moment some minutes before NOW. */
export function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * 60_000);
}

/** A day some days before or after TODAY. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** The signed-in user. */
export const CURRENT_USER = {
  id: 'u-ines',
  name: 'Inês Carvalho',
  email: 'ines@copperline.app',
  role: 'Head of support',
} as const;

const longDate = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long' });
const shortDate = new Intl.DateTimeFormat(LOCALE, { month: 'short', day: 'numeric' });
const monthYear = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
const time = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit' });
const count = new Intl.NumberFormat(LOCALE);
const percent = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 1 });

export const formatLongDate = (date: Date) => longDate.format(date);
export const formatShortDate = (date: Date) => shortDate.format(date);
export const formatMonth = (date: Date) => monthYear.format(date);
export const formatTime = (date: Date) => time.format(date);
export const formatCount = (value: number) => count.format(value);
/** A fraction as a percentage: 0.942 is "94.2%". */
export const formatPercent = (fraction: number) => percent.format(fraction);

/** A span of minutes as people say it: "48m", "1h 12m", "2d 3h". */
export function formatDuration(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${String(m)}m`;
  const hours = Math.floor(m / 60);
  if (hours < 24)
    return m % 60 === 0 ? `${String(hours)}h` : `${String(hours)}h ${String(m % 60)}m`;
  const days = Math.floor(hours / 24);
  return hours % 24 === 0 ? `${String(days)}d` : `${String(days)}d ${String(hours % 24)}h`;
}

/** A date as an ISO day, for `<time dateTime>`. */
export function isoDay(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${String(date.getFullYear())}-${m}-${d}`;
}

/** "1 ticket", "3 tickets". */
export const plural = (n: number, one: string, many = `${one}s`) =>
  `${formatCount(n)} ${n === 1 ? one : many}`;

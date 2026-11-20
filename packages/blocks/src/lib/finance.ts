/**
 * Money and date arithmetic the blocks share. Amounts arrive in major units (12.5 is 12.50 EUR);
 * every sum runs in the currency's minor units so a column of figures never drifts by a cent.
 */

const digitsCache = new Map<string, number>();

/** Decimal places of a currency: 2 for EUR and GBP, 0 for JPY, 3 for KWD. */
export function minorDigits(currency: string): number {
  const cached = digitsCache.get(currency);
  if (cached !== undefined) return cached;
  const digits =
    new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  digitsCache.set(currency, digits);
  return digits;
}

/**
 * Rounds to a whole number, half away from zero, as invoices and tax returns do: 2.5 is 3 and
 * -2.5 is -3, where Math.round gives -2. The value is first read back at 15 significant digits,
 * which drops binary noise at any size: 1.005 * 100 is 100.49999999999999 and 5432943.1 * 0.05 *
 * 100 is 27164715.499999996, and both are true halves.
 */
export function roundHalfAway(value: number): number {
  const clean = Number(Math.abs(value).toPrecision(15));
  return Math.sign(value) * Math.round(clean);
}

/** Major units to integer minor units, rounding half away from zero as invoices do. */
export function toMinor(amount: number, currency: string): number {
  return roundHalfAway(amount * 10 ** minorDigits(currency));
}

export function fromMinor(minor: number, currency: string): number {
  return minor / 10 ** minorDigits(currency);
}

/** An amount rounded to the currency's minor unit. */
export function roundMoney(amount: number, currency: string): number {
  return fromMinor(toMinor(amount, currency), currency);
}

/** Sum of amounts, exact to the minor unit. */
export function sumMoney(amounts: Iterable<number>, currency: string): number {
  let minor = 0;
  for (const amount of amounts) minor += toMinor(amount, currency);
  return fromMinor(minor, currency);
}

const DAY_MS = 86_400_000;

/** Whole calendar days from `from` to `to` (negative when `to` is earlier), ignoring the clock. */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / DAY_MS);
}

/** Relative change from `previous` to `current`; null when there is nothing to compare with. */
export function relativeChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

/** U+2212 MINUS SIGN, the same width as a plus, as Money prints it. */
export const MINUS = '−';

/** A signed percentage such as +4.2% or −12%, with the true minus sign. */
export function formatPercent(
  value: number,
  locale: string | undefined,
  { signed = false, digits = 1 }: { signed?: boolean; digits?: number } = {},
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
    signDisplay: signed ? 'exceptZero' : 'auto',
  })
    .format(value)
    .replace('-', MINUS);
}

/** A compact amount for chart axes: €12k, £1.2m. */
export function formatCompactMoney(
  amount: number,
  currency: string,
  locale: string | undefined,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  })
    .format(amount)
    .replace('-', MINUS);
}

/** Short date for tables: 4 Mar, 4 mar. */
export function formatShortDate(date: Date, locale: string | undefined): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
}

/** Full date for documents: 4 March 2026, 4 marca 2026. */
export function formatLongDate(date: Date, locale: string | undefined): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date);
}

/** What an invoice is in the books. A `sent` invoice becomes overdue on its own after its due date. */
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';

/** The locale to format with: the one asked for, or the runtime's own. */
export function resolveLocale(locale?: string): string {
  return locale ?? new Intl.NumberFormat().resolvedOptions().locale;
}

export interface Stat {
  id: string;
  /** The figure itself: 14200000, 0.998 or 48. */
  value: number;
  /**
   * How to write it: `number` in full (12,480), `compact` shortened (14.2M), `percent` from a
   * fraction (0.998 is 99.8%), `currency` in `currency` units, shortened.
   */
  format: 'number' | 'compact' | 'percent' | 'currency';
  /** What the figure counts, such as "invoices sent last year". */
  label: string;
  /** ISO 4217 code, for `currency`. */
  currency?: string;
  /** Text after the figure, such as "+" or "h". */
  suffix?: string;
  /** Digits after the decimal point; the format picks a sensible default. */
  fractionDigits?: number;
}

/** Writes a stat for its locale. Exported so a server or an OG image can write the same figure. */
export function formatStat(stat: Stat, value: number, locale?: string): string {
  const digits = stat.fractionDigits;
  let text: string;
  switch (stat.format) {
    case 'compact':
      text = new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: digits ?? 1,
      }).format(value);
      break;
    case 'percent':
      text = new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits: digits ?? 1,
      }).format(value);
      break;
    case 'currency':
      text = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: stat.currency ?? 'EUR',
        notation: 'compact',
        maximumFractionDigits: digits ?? 1,
      }).format(value);
      break;
    case 'number':
      text = new Intl.NumberFormat(locale, { maximumFractionDigits: digits ?? 0 }).format(
        Math.round(value * 10 ** (digits ?? 0)) / 10 ** (digits ?? 0),
      );
      break;
  }
  return stat.suffix === undefined ? text : `${text}${stat.suffix}`;
}

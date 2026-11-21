/** U+2212 MINUS SIGN: the width of a plus, so signed figures stay aligned. */
const MINUS = '−';

/**
 * How a figure is written. `currency` is an amount in major units of `currency`; `percent` is a
 * fraction (0.24 is 24%); `number` is a count or a measure; `duration` is a number of seconds,
 * written in its two largest units, such as 1h 20m.
 */
export type ValueFormat = 'number' | 'currency' | 'percent' | 'duration';

export interface ValueFormatOptions {
  locale?: string | undefined;
  /** The ISO 4217 code for `currency`; ignored by the other formats. */
  currency?: string | undefined;
  /** Short forms for axis ticks and tight places: 12K, €1.2M, 45%. */
  compact?: boolean | undefined;
  /** Print a plus before a positive figure, for a change. */
  signed?: boolean | undefined;
  /** Most digits after the decimal point; the format's own default when left out. */
  maximumFractionDigits?: number | undefined;
}

const DURATION_UNITS = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
] as const;

/** Seconds as their two largest whole units in the locale's narrow form: 1h 20m, 45s, 3d 4h. */
export function formatDuration(seconds: number, locale?: string, compact = false): string {
  const sign = seconds < 0 ? MINUS : '';
  let rest = Math.round(Math.abs(seconds));
  const parts: string[] = [];
  for (const [unit, size] of DURATION_UNITS) {
    const count = Math.floor(rest / size);
    if (count === 0 && !(unit === 'second' && parts.length === 0)) continue;
    rest -= count * size;
    parts.push(
      new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'narrow' }).format(count),
    );
    if (parts.length === (compact ? 1 : 2)) break;
  }
  return sign + parts.join(' ');
}

/**
 * A figure written in its format with the true minus sign: the one formatter behind every axis,
 * tooltip, legend and table of the charts, so a figure reads the same wherever it appears.
 */
export function formatValue(
  value: number,
  format: ValueFormat = 'number',
  options: ValueFormatOptions = {},
): string {
  const { locale, currency, compact = false, signed = false, maximumFractionDigits } = options;
  if (format === 'duration') {
    const text = formatDuration(value, locale, compact);
    return signed && value > 0 ? `+${text}` : text;
  }
  const style: Intl.NumberFormatOptions =
    format === 'currency' && currency !== undefined
      ? // Whole amounts drop the cents: €1,211, not €1,211.00.
        {
          style: 'currency',
          currency,
          ...(Number.isInteger(value) ? { minimumFractionDigits: 0 } : {}),
        }
      : format === 'percent'
        ? { style: 'percent', maximumFractionDigits: 1 }
        : { maximumFractionDigits: 2 };
  return new Intl.NumberFormat(locale, {
    ...style,
    // Compact figures drop trailing zeros: €13k, not €13.0k.
    ...(compact ? { notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 } : {}),
    ...(maximumFractionDigits === undefined
      ? {}
      : { minimumFractionDigits: 0, maximumFractionDigits }),
    signDisplay: signed ? 'exceptZero' : 'auto',
  })
    .formatToParts(value)
    .map((part) => (part.type === 'minusSign' ? MINUS : part.value))
    .join('');
}

/**
 * Relative change from `previous` to `current` as a fraction (0.12 is 12% up); null when there is
 * nothing to compare against, so a change from zero is never shown as infinite.
 */
export function relativeChange(current: number, previous: number): number | null {
  if (previous === 0 || !Number.isFinite(previous) || !Number.isFinite(current)) return null;
  return (current - previous) / Math.abs(previous);
}

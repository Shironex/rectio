import { MINUS } from './finance';

/**
 * How a figure is written. `currency` is an amount in major units of the block's currency;
 * `percent` is a fraction (0.24 is 24%); `number` is a count or a measure; `duration` is a number
 * of seconds, written in its two largest units, such as 1h 20m.
 */
export type ValueFormat = 'currency' | 'percent' | 'number' | 'duration';

export interface ValueFormatOptions {
  locale: string | undefined;
  /** The ISO currency for `currency`; ignored by the other formats. */
  currency?: string | undefined;
  /** Short forms for axis ticks: 12k, €1.2m, 45%. */
  compact?: boolean | undefined;
  /** Print a plus before a positive figure, for a change. */
  signed?: boolean | undefined;
}

const DURATION_UNITS = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
] as const;

/** Seconds as their two largest whole units in the locale's narrow form: 1h 20m, 45s, 3d 4h. */
export function formatDuration(seconds: number, locale: string | undefined, compact = false) {
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

/** A figure written in its format, with the true minus sign. */
export function formatValue(value: number, format: ValueFormat, options: ValueFormatOptions) {
  const { locale, currency, compact = false, signed = false } = options;
  if (format === 'duration') {
    const text = formatDuration(value, locale, compact);
    return signed && value > 0 ? `+${text}` : text;
  }
  const style: Intl.NumberFormatOptions =
    format === 'currency' && currency !== undefined
      ? { style: 'currency', currency }
      : format === 'percent'
        ? { style: 'percent', maximumFractionDigits: 1 }
        : { maximumFractionDigits: 2 };
  return new Intl.NumberFormat(locale, {
    ...style,
    ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}),
    signDisplay: signed ? 'exceptZero' : 'auto',
  })
    .format(value)
    .replace('-', MINUS);
}

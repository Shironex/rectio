import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon } from '@phosphor-icons/react/ssr';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';

/** U+2212 MINUS SIGN: the width of a plus, so signed figures stay aligned. */
const MINUS = '−';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface TrendChipLabels {
  up: string;
  down: string;
  flat: string;
  better: string;
  worse: string;
}

export const TREND_CHIP_LABELS: TrendChipLabels = {
  up: 'up',
  down: 'down',
  flat: 'no change',
  better: 'better',
  worse: 'worse',
};

export interface TrendChipProps extends Omit<ComponentProps<'span'>, 'children'> {
  /**
   * The change. With `format="percent"` a fraction (0.124 is 12.4%); with `points` percentage
   * points as a fraction (0.021 is 2.1 pts); otherwise the figure itself.
   */
  value: number;
  format?: 'percent' | 'points' | 'number' | undefined;
  locale?: string | undefined;
  /** Writes the figure yourself, such as `+3 days`. The sign of `value` still sets the arrow. */
  display?: ReactNode;
  /**
   * Which way is good news. Revenue up is good (`up`); churn up is bad (`down`). `none` keeps the
   * chip neutral for a change that is neither. The arrow and the words say the direction either way.
   */
  better?: 'up' | 'down' | 'none' | undefined;
  /** What it is compared with, after the chip: `vs last month`. */
  comparison?: ReactNode;
  /** `soft` sits on a tint, for cards and headers; `plain` is text only, for tables and tight rows. */
  variant?: 'soft' | 'plain' | undefined;
  size?: 'sm' | 'md' | undefined;
  /** The words screen readers hear for direction and verdict. */
  labels?: Partial<TrendChipLabels> | undefined;
}

const ARROWS = { up: ArrowUpRightIcon, down: ArrowDownRightIcon, flat: ArrowRightIcon };

const TONE = {
  positive: { soft: 'bg-positive-subtle text-positive-strong', plain: 'text-positive-strong' },
  negative: { soft: 'bg-negative-subtle text-negative-strong', plain: 'text-negative-strong' },
  neutral: { soft: 'bg-surface-sunken text-fg-muted', plain: 'text-fg-muted' },
} as const;

/** The change written with its sign: +12.4%, −2.1 pts, +340. */
export function formatTrend(
  value: number,
  format: TrendChipProps['format'] = 'percent',
  locale?: string,
): string {
  const options: Intl.NumberFormatOptions =
    format === 'percent'
      ? { style: 'percent', maximumFractionDigits: 1 }
      : { maximumFractionDigits: format === 'points' ? 1 : 2 };
  const figure = new Intl.NumberFormat(locale, { ...options, signDisplay: 'exceptZero' })
    .formatToParts(format === 'points' ? value * 100 : value)
    .map((part) => (part.type === 'minusSign' ? MINUS : part.value))
    .join('');
  return format === 'points' ? `${figure} pts` : figure;
}

/**
 * A change in a small chip: an arrow, the signed figure and, for screen readers, the direction and
 * whether it is good news in words. Colour says good or bad; the arrow and the sign say up or down,
 * so the meaning never rests on colour.
 */
export function TrendChip({
  value,
  format = 'percent',
  locale,
  display,
  better = 'up',
  comparison,
  variant = 'soft',
  size = 'sm',
  labels,
  className,
  ...props
}: TrendChipProps) {
  const words = { ...TREND_CHIP_LABELS, ...labels };
  const direction: TrendDirection = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const verdict =
    better === 'none' || direction === 'flat' ? null : direction === better ? 'better' : 'worse';
  const tone = verdict === 'better' ? 'positive' : verdict === 'worse' ? 'negative' : 'neutral';
  const Arrow = ARROWS[direction];
  return (
    <span
      data-slot="trend-chip"
      data-direction={direction}
      className={cn(
        'inline-flex max-w-full items-center gap-1.5',
        size === 'sm' ? 'text-sm' : 'text-base',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-0.5 font-medium',
          TONE[tone][variant],
          variant === 'soft' && 'rounded-badge px-1.5 py-0.5',
          variant === 'soft' && size === 'sm' && 'text-xs',
        )}
      >
        <Arrow aria-hidden weight="bold" className={size === 'sm' ? 'size-3' : 'size-3.5'} />
        <span className="sr-only">{words[direction]} </span>
        <span className="numeric">{display ?? formatTrend(value, format, locale)}</span>
        {verdict !== null && <span className="sr-only">, {words[verdict]}</span>}
      </span>
      {comparison !== undefined && (
        <span className="min-w-0 truncate text-fg-muted">{comparison}</span>
      )}
    </span>
  );
}

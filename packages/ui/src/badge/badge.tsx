import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';

export type BadgeTone = 'neutral' | 'positive' | 'negative' | 'warning' | 'info';

const TONES: Record<BadgeTone, string> = {
  // The strong border keeps a neutral badge visible on dark rows, where the sunken fill is close
  // to the canvas.
  neutral: 'border-line-strong bg-surface-sunken text-fg-muted',
  positive: 'border-positive-strong/25 bg-positive-subtle text-positive-strong',
  negative: 'border-negative-strong/25 bg-negative-subtle text-negative-strong',
  warning: 'border-warning-strong/25 bg-warning-subtle text-warning-strong',
  info: 'border-info-strong/25 bg-info-subtle text-info-strong',
};

export interface BadgeProps extends ComponentProps<'span'> {
  /**
   * The meaning, not the colour: `positive` for Paid or Approved, `negative` for Overdue or
   * Rejected, `warning` for Due soon, `info` for Sent, `neutral` for Draft. The label always says
   * the state in words, so the tint only reinforces it.
   */
  tone?: BadgeTone;
}

/** A short status label for a row or a record, such as an invoice state. */
export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-tone={tone}
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap',
        'rounded-(--rx-badge-radius) border px-1.5 py-px text-xs font-medium',
        '[&_svg]:size-3 [&_svg]:shrink-0',
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

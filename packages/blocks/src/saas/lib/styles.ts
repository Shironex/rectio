import { cn, type ProgressTone } from '@rectio/ui';

/**
 * Class strings the SaaS blocks' local pieces share, matching the ones @rectio/ui uses inside its
 * own components, so a block's own controls sit beside the shared ones without a seam.
 */

/** A 44px hit area around a small pressable on touch screens; the drawn control keeps its size. */
export const touchTarget = cn(
  'pointer-coarse:after:absolute pointer-coarse:after:inset-auto pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2',
  'pointer-coarse:after:size-full pointer-coarse:after:-translate-1/2',
  'pointer-coarse:after:min-h-(--rx-button-height-touch) pointer-coarse:after:min-w-(--rx-button-height-touch)',
);

/** The one focus signal, outside the border. */
export const focusRing = 'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus';

/** A text link inside a block: underlined, the focus ring on keyboard. */
export const inlineLink = cn(
  'cursor-pointer rounded-badge font-medium text-fg underline decoration-line-strong underline-offset-4',
  'hover:decoration-fg',
  focusRing,
);

/** How full an allowance is: room to spare, running short, or used up. */
export type UsageLevel = 'ok' | 'warning' | 'over';

/** The kit Meter's tone for each usage level. */
export const USAGE_TONE: Record<UsageLevel, ProgressTone> = {
  ok: 'accent',
  warning: 'warning',
  over: 'negative',
};

/** The note under a meter takes the level's ink, so a full meter is never red alone. */
export const USAGE_NOTE: Record<UsageLevel, string> = {
  ok: 'text-fg-muted',
  warning: 'text-warning-strong',
  over: 'text-negative-strong',
};

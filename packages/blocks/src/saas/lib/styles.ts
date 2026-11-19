import { cn } from '@rectio/ui';

/**
 * Class strings the SaaS blocks' local pieces share, matching the ones @rectio/ui uses inside its
 * own components, so a block's switch, menu and popover sit beside a Select without a seam.
 */

/** A 44px hit area around a small pressable on touch screens; the drawn control keeps its size. */
export const touchTarget = cn(
  'pointer-coarse:after:absolute pointer-coarse:after:inset-auto pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2',
  'pointer-coarse:after:size-full pointer-coarse:after:-translate-1/2',
  'pointer-coarse:after:min-h-(--rx-button-height-touch) pointer-coarse:after:min-w-(--rx-button-height-touch)',
);

/** The floating surface of a menu or popover. */
export const popupSurface = cn(
  'rounded-(--rx-popover-radius) border border-line bg-surface-overlay text-fg shadow-(--rx-popover-shadow)',
  'outline-none',
);

/** Grows from its trigger on the enter easing and leaves faster, never from scale 0. */
export const popupMotion = cn(
  'origin-(--transform-origin) transition-[opacity,scale,translate] ease-enter duration-base',
  'data-starting-style:scale-(--rx-motion-scale-from) data-starting-style:opacity-0',
  'data-starting-style:-translate-y-(--rx-motion-distance-shift)',
  'data-ending-style:opacity-0 data-ending-style:ease-exit data-ending-style:duration-fast',
);

/** A row in a menu or a popover list. */
export const popupItem = cn(
  'flex cursor-default items-center gap-2 rounded-(--rx-field-radius) py-1.5 ps-2 pe-3 text-base outline-none select-none',
  'pointer-coarse:min-h-(--rx-field-height-touch)',
  'data-highlighted:bg-accent-subtle data-highlighted:text-fg',
  'data-disabled:text-fg-disabled',
);

/** The one focus signal, outside the border. */
export const focusRing = 'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus';

/** A text link inside a block: underlined, the focus ring on keyboard. */
export const inlineLink = cn(
  'cursor-pointer rounded-badge font-medium text-fg underline decoration-line-strong underline-offset-4',
  'hover:decoration-fg',
  focusRing,
);

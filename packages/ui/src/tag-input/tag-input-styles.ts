import { cn, touchHitArea } from '../lib/cn';

/** The remove button of a tag. A plain string, so a server component can use it too. */

/**
 * The remove button inside a Tag. Exported so a chip built on another primitive (the Multi select's
 * Base UI chip) draws the same button. Under a disabled field or tag it is hidden: nothing to press.
 */
export const tagRemoveButton = cn(
  'relative -me-0.5 flex size-4 shrink-0 cursor-pointer items-center justify-center',
  'rounded-(--rx-badge-radius) text-fg-subtle',
  'transition-colors duration-fast ease-standard',
  'hover:bg-surface-hover hover:text-fg',
  'in-focus-visible:text-accent-contrast in-focus-visible:hover:bg-transparent',
  'focus-visible:outline-2 focus-visible:outline-focus',
  'in-data-disabled:hidden',
  // A 44px target on touch screens; tag rows are spaced so neighbours never share one.
  touchHitArea,
);

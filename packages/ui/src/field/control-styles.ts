import { cn } from '../lib/cn';

/** The control classes every field shares. Plain strings, so a server component can use them too. */

/** The control surface shared by Input, AmountInput and the Select trigger. */
export const controlSurface = cn(
  // Taller on touch screens, a 44px target, without touching desktop density.
  'h-(--rx-field-height) pointer-coarse:h-(--rx-field-height-touch) w-full min-w-0 rounded-(--rx-field-radius)',
  'border border-(--rx-field-border) bg-(--rx-field-background) text-base text-fg',
  'transition-[border-color,outline-color] duration-fast ease-standard',
  'outline-0 -outline-offset-1 outline-transparent hover:border-fg-subtle',
  'data-invalid:border-negative data-invalid:ring-1 data-invalid:ring-negative data-invalid:ring-inset',
  'data-disabled:cursor-not-allowed data-disabled:border-line-disabled data-disabled:bg-surface-sunken data-disabled:text-fg-disabled',
);

/**
 * Focus ring for the element that holds keyboard focus. One signal everywhere: it sits outside the
 * border, so an invalid field shows its red edge and the focus ring together.
 */
export const controlFocus =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

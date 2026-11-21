import { controlSurface } from '../field/control-styles';
import { cn } from '../lib/cn';

/** Classes the combobox and its relatives share. Plain strings, so a server component can use them. */

/** The surface of a combobox-like control: the field look, a ring while anything inside has focus. */
export const comboboxSurface = cn(
  controlSurface,
  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
  // While the list is open the user is fixing the field: show it neutral, not still wrong.
  'data-popup-open:border-fg-subtle data-popup-open:data-invalid:border-fg-subtle data-popup-open:data-invalid:ring-0',
);

/** The small buttons at the end of a combobox: clear and open. 44px wide on touch screens. */
export const comboboxIconButton = cn(
  'flex h-full w-7 shrink-0 cursor-pointer items-center justify-center text-fg-subtle',
  'rounded-(--rx-badge-radius) transition-colors duration-fast ease-standard hover:text-fg',
  'outline-none pointer-coarse:w-(--rx-field-height-touch)',
  'data-disabled:cursor-not-allowed data-disabled:text-fg-disabled',
);

import { cn } from '../lib/cn';
import { popoverSurface } from '../popover/popover-surface';
import { popupMotion } from '../select/popup-styles';

/** The menu's popup and row classes. Plain strings, so a server component can use them too. */

/** The popup of a menu, a submenu or a context menu. */
export const menuPopup = cn(
  'max-h-(--available-height) min-w-48 overflow-y-auto p-1',
  popoverSurface,
  popupMotion,
);

/** A row in a menu. Shared with the context menu and the motioned menu. */
export const menuItem = cn(
  'relative flex cursor-default items-center gap-2 scroll-my-1',
  'rounded-(--rx-field-radius) py-1.5 ps-2 pe-2 text-base text-fg outline-none select-none',
  'pointer-coarse:min-h-(--rx-field-height-touch)',
  'data-highlighted:bg-accent-subtle data-disabled:text-fg-disabled',
  // Under a popup with one gliding highlight of its own (the motion add-on), rows let it show.
  'in-data-glide:data-highlighted:bg-transparent',
  '[&_svg]:shrink-0',
);

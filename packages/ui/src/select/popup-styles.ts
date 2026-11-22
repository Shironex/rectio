import { cn } from '../lib/cn';

/**
 * The popup classes Select, Combobox, Menu and the date pickers share. Plain strings, so a server
 * component can compose them too.
 */

/** Shared by Select popups and menus, popovers and hover cards: enters from the trigger, leaves as a fade. */
export const popupMotion = cn(
  'origin-(--transform-origin) transition-[opacity,scale,translate] ease-enter duration-base',
  'data-starting-style:scale-(--rx-motion-scale-from) data-starting-style:opacity-0',
  // Out of the trigger's side: down from below it, up from above, sideways beside it.
  'data-starting-style:-translate-y-(--rx-motion-distance-shift)',
  'data-[side=top]:data-starting-style:translate-y-(--rx-motion-distance-shift)',
  'data-[side=right]:data-starting-style:translate-y-0 data-[side=right]:data-starting-style:-translate-x-(--rx-motion-distance-shift)',
  'data-[side=left]:data-starting-style:translate-y-0 data-[side=left]:data-starting-style:translate-x-(--rx-motion-distance-shift)',
  'data-[side=inline-end]:data-starting-style:translate-y-0 data-[side=inline-end]:data-starting-style:-translate-x-(--rx-motion-distance-shift)',
  'data-[side=inline-start]:data-starting-style:translate-y-0 data-[side=inline-start]:data-starting-style:translate-x-(--rx-motion-distance-shift)',
  'rtl:data-[side=inline-end]:data-starting-style:translate-x-(--rx-motion-distance-shift)',
  'rtl:data-[side=inline-start]:data-starting-style:-translate-x-(--rx-motion-distance-shift)',
  'data-ending-style:opacity-0 data-ending-style:ease-exit data-ending-style:duration-fast',
);

/**
 * The surface of a list popup: Select, Combobox and Multi select share it, so every list in a
 * theme scope reads as the same object.
 */
export const popupSurface = cn(
  'rounded-(--rx-popover-radius) border border-line bg-surface-overlay text-fg shadow-(--rx-popover-shadow) backdrop-surface',
  'outline-none',
);

/** One option row in a list popup, highlighted by keyboard or pointer, check mark on the left. */
export const popupItem = cn(
  'flex cursor-default scroll-my-1 items-center gap-2',
  'rounded-(--rx-field-radius) py-1.5 ps-2 pe-3 text-base outline-none select-none',
  'pointer-coarse:min-h-(--rx-field-height-touch)',
  'data-highlighted:bg-accent-subtle data-highlighted:text-fg data-selected:font-medium',
  'data-disabled:text-fg-disabled',
);

/** The small caps heading of a group of options. */
export const popupGroupLabel =
  'px-2 pt-2 pb-1 text-xs font-medium tracking-caps text-fg-subtle uppercase';

import { cn } from '../lib/cn';

/** The popover's surface classes. A plain string, so a server component can use it too. */

/** The panel every anchored overlay shares: hairline, overlay surface, the popover shadow. */
export const popoverSurface = cn(
  'rounded-(--rx-popover-radius) border border-line bg-surface-overlay text-fg shadow-(--rx-popover-shadow)',
  'outline-none',
);

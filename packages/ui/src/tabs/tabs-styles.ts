import { cn } from '../lib/cn';

/** The tab indicator classes. Plain strings, so a server component can use them too. */

/**
 * `line`: page sections, an underline under the active tab. `segmented`: a few views of the same
 * thing (chart or table, month or quarter), drawn as a switch.
 */
export type TabsVariant = 'line' | 'segmented';

/** The underline or the raised pill, placed on the active tab from Base UI's measurements. */
export const tabsIndicator: Record<TabsVariant, string> = {
  line: cn(
    'absolute bottom-0 left-0 h-0.5 rounded-full bg-accent',
    'w-(--active-tab-width) translate-x-(--active-tab-left)',
  ),
  segmented: cn(
    'absolute top-(--active-tab-top) left-0 -z-1 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left)',
    'rounded-control bg-surface-overlay shadow-raised ring-1 ring-line-strong',
  ),
};

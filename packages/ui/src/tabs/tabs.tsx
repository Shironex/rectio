'use client';

import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { createContext, use, type ComponentProps, type ReactNode } from 'react';

import { cn } from '../lib/cn';
import { tabsIndicator, type TabsVariant } from './tabs-styles';

export { tabsIndicator, type TabsVariant } from './tabs-styles';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

const VariantContext = createContext<TabsVariant>('line');

export const Tabs = BaseTabs.Root;

export type TabsListProps = WithClassName<ComponentProps<typeof BaseTabs.List>> & {
  variant?: TabsVariant;
  /** Set false to render without the indicator, for a motioned indicator of your own. */
  indicator?: boolean;
  children: ReactNode;
};

const listStyles: Record<TabsVariant, string> = {
  // Scrolls sideways on a phone instead of wrapping, so the underline stays on one line.
  line: 'flex max-w-full gap-1 overflow-x-auto border-b border-line',
  segmented:
    'inline-flex max-w-full gap-0.5 rounded-control border border-line bg-surface-sunken p-0.5',
};

/**
 * The row of tabs. Arrow keys move between tabs and activate them (set `activateOnFocus={false}`
 * when a panel is slow to render, so Enter or Space activates instead); Home and End jump to the
 * ends.
 * The indicator jumps to the active tab; the motion add-on glides it.
 */
export function TabsList({
  className,
  variant = 'line',
  indicator = true,
  activateOnFocus = true,
  children,
  ...props
}: TabsListProps) {
  return (
    <VariantContext value={variant}>
      <BaseTabs.List
        data-slot="tabs-list"
        data-variant={variant}
        activateOnFocus={activateOnFocus}
        className={cn('relative isolate', listStyles[variant], className)}
        {...props}
      >
        {children}
        {indicator && (
          <BaseTabs.Indicator data-slot="tabs-indicator" className={tabsIndicator[variant]} />
        )}
      </BaseTabs.List>
    </VariantContext>
  );
}

export type TabsTabProps = WithClassName<ComponentProps<typeof BaseTabs.Tab>> & {
  /** A count after the label, such as open items in that view. */
  hint?: ReactNode;
};

const tabStyles: Record<TabsVariant, string> = {
  line: cn(
    'h-(--rx-tabs-height) px-3 pointer-coarse:h-(--rx-control-height-touch)',
    'rounded-t-control hover:bg-surface-hover data-active:hover:bg-transparent',
  ),
  segmented: cn(
    'h-(--rx-control-height-sm) grow justify-center rounded-control px-3',
    'pointer-coarse:h-(--rx-control-height-touch) pointer-coarse:px-3.5',
  ),
};

export function TabsTab({ className, hint, children, ...props }: TabsTabProps) {
  const variant = use(VariantContext);
  return (
    <BaseTabs.Tab
      data-slot="tabs-tab"
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-medium whitespace-nowrap',
        'text-fg-muted transition-colors duration-fast ease-standard',
        'hover:text-fg data-active:text-fg data-disabled:cursor-default data-disabled:text-fg-disabled',
        '-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        tabStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
      {hint !== undefined && (
        <span className="text-fg-subtle numeric in-data-active:text-fg-muted">{hint}</span>
      )}
    </BaseTabs.Tab>
  );
}

export type TabsPanelProps = WithClassName<ComponentProps<typeof BaseTabs.Panel>>;

/** One tab's content. It is focusable, so a keyboard user can Tab from the list into it. */
export function TabsPanel({ className, ...props }: TabsPanelProps) {
  return (
    <BaseTabs.Panel
      data-slot="tabs-panel"
      className={cn(
        'pt-4 outline-none focus-visible:rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus',
        className,
      )}
      {...props}
    />
  );
}

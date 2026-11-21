'use client';

import { createContext, use, useState, type ComponentProps } from 'react';

import { cn } from '../lib/cn';

const PortalContainerContext = createContext<HTMLElement | null | undefined>(undefined);

/**
 * Where popups of the nearest ThemeScope render. Undefined outside a scope, which lets Base UI
 * portal to the document body.
 */
export function usePortalContainer(): HTMLElement | null | undefined {
  return use(PortalContainerContext);
}

export interface ThemeScopeProps extends ComponentProps<'div'> {
  /** A theme id: `default`, the theme @rectio/tokens ships, or one of your own. */
  theme?: string;
  /** Leave unset to follow the system colour scheme. */
  mode?: 'light' | 'dark';
  density?: 'comfortable' | 'compact';
  /**
   * A skin id: `dense`, `editorial`, or one of your own. Changes type, corners, rhythm and control
   * sizes on top of the theme, in either mode. Leave unset for the theme as it is.
   */
  skin?: string | undefined;
}

/**
 * Applies a theme (and optionally a skin) to a subtree. Popups (select lists, dialogs) opened inside it portal into the
 * scope, so they keep its tokens: one page can show several themes, or one theme per tenant.
 */
export function ThemeScope({
  theme = 'default',
  mode,
  density,
  skin,
  className,
  children,
  ...props
}: ThemeScopeProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div
      data-theme={theme}
      data-mode={mode}
      data-density={density === 'compact' ? 'compact' : undefined}
      data-skin={skin}
      className={cn('bg-surface-canvas font-sans text-base text-fg', className)}
      {...props}
    >
      <PortalContainerContext value={container}>{children}</PortalContainerContext>
      <div ref={setContainer} data-slot="portal-host" />
    </div>
  );
}

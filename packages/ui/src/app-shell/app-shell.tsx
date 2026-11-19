import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  type SidebarProviderProps,
} from '../sidebar/sidebar';
import { TooltipProvider } from '../tooltip/tooltip';

export interface AppShellProps extends Omit<SidebarProviderProps, 'children'> {
  /** A `Sidebar`. */
  sidebar: ReactNode;
  /** An `AppShellHeader`, sticky above the page. */
  header?: ReactNode;
  /** The page. */
  children: ReactNode;
  /** Text of the skip link, the first stop of the Tab order. Default "Skip to content". */
  skipLabel?: string;
  /** Id of the main landmark, the skip link's target. Default "main". */
  mainId?: string;
  className?: string;
  mainClassName?: string;
}

/**
 * The frame of an app: the sidebar, a sticky header and the page, wired together. The page scrolls
 * the window, so browser find, scroll restoration and pull to refresh behave as on any page. The
 * first Tab stop is a skip link past the navigation. Tooltips inside share one delay group.
 */
export function AppShell({
  sidebar,
  header,
  children,
  skipLabel = 'Skip to content',
  mainId = 'main',
  className,
  mainClassName,
  ...provider
}: AppShellProps) {
  return (
    <SidebarProvider {...provider}>
      <TooltipProvider>
        <div
          data-slot="app-shell"
          className={cn('flex min-h-dvh bg-surface-canvas text-fg', className)}
        >
          <a
            href={`#${mainId}`}
            className={cn(
              'fixed start-2 top-2 z-50 -translate-y-16 rounded-control bg-surface-overlay px-3 py-2 text-sm font-medium text-fg shadow-overlay',
              'outline-2 outline-focus focus-visible:translate-y-0',
            )}
          >
            {skipLabel}
          </a>
          {sidebar}
          <SidebarInset>
            {header}
            <main id={mainId} tabIndex={-1} className={cn('flex-1 outline-none', mainClassName)}>
              {children}
            </main>
          </SidebarInset>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );
}

export interface AppShellHeaderProps extends Omit<ComponentProps<'header'>, 'title'> {
  /** The page title or a `Breadcrumb`, after the sidebar trigger. */
  title?: ReactNode;
  /** Search, notifications, the account menu: at the end. */
  actions?: ReactNode;
  /** Set false to leave out the sidebar trigger. */
  showTrigger?: boolean;
}

/** The top bar of the page column: sidebar trigger, title, actions. Sticks to the top. */
export function AppShellHeader({
  title,
  actions,
  showTrigger = true,
  className,
  children,
  ...props
}: AppShellHeaderProps) {
  return (
    <header
      data-slot="app-shell-header"
      className={cn(
        'sticky top-0 z-40 flex h-(--rx-app-shell-header-height) shrink-0 items-center gap-2 border-b border-line bg-surface-canvas px-3 sm:px-4',
        className,
      )}
      {...props}
    >
      {showTrigger && <SidebarTrigger className="-ms-1" />}
      {showTrigger && title !== undefined && (
        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-line" />
      )}
      {title !== undefined && <div className="flex min-w-0 flex-1 items-center">{title}</div>}
      {children}
      {actions !== undefined && (
        <div className="ms-auto flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

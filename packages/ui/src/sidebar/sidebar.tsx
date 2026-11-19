import { Collapsible } from '@base-ui/react/collapsible';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { CaretDownIcon, SidebarSimpleIcon } from '@phosphor-icons/react';
import {
  createContext,
  use,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';

import { useShortcut } from '../kbd/shortcut';
import { cn, touchHitArea } from '../lib/cn';
import { Menu, MenuContent, MenuGroup, MenuLinkItem, MenuTrigger } from '../menu/menu';
import { Sheet, SheetContent, SheetTitle } from '../sheet/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/tooltip';

/** Below this width the sidebar becomes an off-canvas sheet: Tailwind's `md` breakpoint. */
const MOBILE_QUERY = '(width < 48rem)';

function subscribeMobile(onChange: () => void) {
  if (typeof matchMedia !== 'function') return () => undefined;
  const list = matchMedia(MOBILE_QUERY);
  list.addEventListener('change', onChange);
  return () => {
    list.removeEventListener('change', onChange);
  };
}

const readMobile = () => typeof matchMedia === 'function' && matchMedia(MOBILE_QUERY).matches;

/** True below the medium breakpoint. False on the server: the desktop markup renders first. */
export function useIsMobileLayout(): boolean {
  return useSyncExternalStore(subscribeMobile, readMobile, () => false);
}

interface SidebarState {
  /** The desktop rail is folded to icons. */
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  /** Below the medium breakpoint: the sidebar is an off-canvas sheet. */
  mobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  /** Folds or unfolds the rail on desktop; opens or closes the sheet on a phone. */
  toggle: () => void;
  shortcut: string | null;
}

const SidebarContext = createContext<SidebarState | null>(null);

/** Rendering inside the phone sheet: never collapsed, and following a link closes the sheet. */
const PlacementContext = createContext<'rail' | 'sheet'>('rail');

/** Inside a collapsed submenu's flyout: sub items render as menu rows. */
const FlyoutContext = createContext(false);

/** The sidebar's state: `collapsed`, `toggle()`, `mobile`, `mobileOpen`. Inside a SidebarProvider. */
export function useSidebar(): SidebarState {
  const state = use(SidebarContext);
  if (state === null) throw new Error('useSidebar must be used inside a SidebarProvider');
  return state;
}

export interface SidebarProviderProps {
  /** Controlled collapsed state of the desktop rail. */
  collapsed?: boolean;
  /** Where the rail starts when uncontrolled; read it from the saved preference. */
  defaultCollapsed?: boolean;
  /** Called on every fold and unfold: save it (a cookie, local storage, the user's settings). */
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * Folds and unfolds the sidebar from anywhere. Default `mod+b` (Command B on a Mac, Control B
   * elsewhere); null to bind nothing. Ignored while typing in a field, where it may mean bold.
   */
  shortcut?: string | null;
  children: ReactNode;
}

export function SidebarProvider({
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  shortcut = 'mod+b',
  children,
}: SidebarProviderProps) {
  const [collapsedState, setCollapsedState] = useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobile = useIsMobileLayout();
  const collapsed = collapsedProp ?? collapsedState;

  const value = useMemo<SidebarState>(() => {
    const setCollapsed = (next: boolean) => {
      if (collapsedProp === undefined) setCollapsedState(next);
      onCollapsedChange?.(next);
    };
    return {
      collapsed,
      setCollapsed,
      mobile,
      mobileOpen,
      setMobileOpen,
      toggle: () => {
        if (mobile) setMobileOpen((open) => !open);
        else setCollapsed(!collapsed);
      },
      shortcut,
    };
  }, [collapsed, collapsedProp, mobile, mobileOpen, onCollapsedChange, shortcut]);

  useShortcut(shortcut, value.toggle, { allowInFields: false });

  return <SidebarContext value={value}>{children}</SidebarContext>;
}

/** Collapsed as drawn here: the phone sheet always shows labels. */
function useCollapsed() {
  const state = useSidebar();
  return use(PlacementContext) === 'rail' && state.collapsed;
}

export interface SidebarProps extends Omit<ComponentProps<'aside'>, 'children'> {
  /** Names the navigation landmark and the phone sheet. Default "Main". */
  label?: string;
  children: ReactNode;
}

/**
 * The app's main navigation. On desktop a full-height column that folds to an icon rail; below
 * the medium breakpoint an off-canvas sheet from the start edge, opened by `SidebarTrigger`.
 */
export function Sidebar({ label = 'Main', className, children, ...props }: SidebarProps) {
  const { collapsed, mobile, mobileOpen, setMobileOpen } = useSidebar();

  if (mobile) {
    return (
      <PlacementContext value="sheet">
        <Sheet side="left" open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            className="w-(--rx-sidebar-width) bg-(--rx-sidebar-background)"
            closeLabel="Close navigation"
          >
            <SheetTitle className="sr-only">{label}</SheetTitle>
            <nav aria-label={label} className="flex min-h-0 flex-1 flex-col">
              {children}
            </nav>
          </SheetContent>
        </Sheet>
      </PlacementContext>
    );
  }

  return (
    <aside
      data-slot="sidebar"
      data-collapsed={collapsed ? '' : undefined}
      className={cn(
        // The server renders this column; a phone hides it until the client swaps in the sheet.
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-line bg-(--rx-sidebar-background) text-fg md:flex',
        collapsed ? 'w-(--rx-sidebar-width-collapsed)' : 'w-(--rx-sidebar-width)',
        className,
      )}
      {...props}
    >
      <nav aria-label={label} className="flex min-h-0 flex-1 flex-col">
        {children}
      </nav>
    </aside>
  );
}

/** The top of the sidebar: the product mark or a workspace switcher. */
export function SidebarHeader({ className, ...props }: ComponentProps<'div'>) {
  const collapsed = useCollapsed();
  return (
    <div
      data-slot="sidebar-header"
      className={cn(
        'flex h-(--rx-app-shell-header-height) shrink-0 items-center gap-2 px-3',
        collapsed && 'justify-center px-0',
        className,
      )}
      {...props}
    />
  );
}

/** The scrolling middle, holding the groups. */
export function SidebarContent({ className, ...props }: ComponentProps<'div'>) {
  const collapsed = useCollapsed();
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-2 py-2',
        collapsed && 'items-center px-1.5',
        className,
      )}
      {...props}
    />
  );
}

/** The bottom: the account menu, settings, help. */
export function SidebarFooter({ className, ...props }: ComponentProps<'div'>) {
  const collapsed = useCollapsed();
  return (
    <div
      data-slot="sidebar-footer"
      className={cn(
        'flex shrink-0 flex-col gap-1 border-t border-line p-2',
        collapsed && 'items-center px-1.5',
        className,
      )}
      {...props}
    />
  );
}

export interface SidebarGroupProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** Names the group. Hidden in the icon rail, where a hairline separates the groups instead. */
  label?: ReactNode;
}

export function SidebarGroup({ label, className, children, ...props }: SidebarGroupProps) {
  const collapsed = useCollapsed();
  const id = useId();
  return (
    <div
      role="group"
      aria-labelledby={label === undefined ? undefined : id}
      data-slot="sidebar-group"
      className={cn('flex w-full flex-col gap-0.5', className)}
      {...props}
    >
      {label !== undefined && (
        <div
          id={id}
          className={cn(
            'px-2 pt-1 pb-1 text-xs font-medium tracking-caps text-fg-subtle uppercase select-none',
            collapsed && 'sr-only',
          )}
        >
          {label}
        </div>
      )}
      {collapsed && label !== undefined && (
        <div aria-hidden className="mx-auto mb-1 h-px w-6 bg-line not-first:mt-0" />
      )}
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  );
}

/** A row of the sidebar: icon, label, an optional count. Shared by items and submenu triggers. */
const row = cn(
  'group/item relative flex h-(--rx-sidebar-item-height) w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-control px-2',
  'text-sm font-medium text-fg-muted no-underline select-none',
  'pointer-coarse:h-(--rx-control-height-touch)',
  'transition-colors duration-fast ease-standard hover:bg-surface-hover hover:text-fg',
  '-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
  'data-current:bg-(--rx-sidebar-item-active) data-current:text-fg',
  'data-active:bg-(--rx-sidebar-item-active) data-active:text-fg',
);

const railRow =
  'size-(--rx-sidebar-item-height) justify-center px-0 pointer-coarse:size-(--rx-control-height-touch)';

function ItemIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-4 shrink-0 items-center justify-center text-fg-subtle transition-colors duration-fast ease-standard',
        'group-hover/item:text-fg-muted group-data-current/item:text-accent-strong group-data-active/item:text-accent-strong',
      )}
    >
      {children}
    </span>
  );
}

/**
 * In the icon rail a count cannot fit: a dot on the icon says something is waiting, and the count
 * stays in the accessible name and the tooltip.
 */
function RailBadge({ children }: { children: ReactNode }) {
  return (
    <>
      <span
        aria-hidden
        data-slot="sidebar-rail-badge"
        className="absolute end-1.5 top-1.5 size-1.5 rounded-full bg-accent ring-2 ring-(--rx-sidebar-background)"
      />
      <span className="sr-only">{children}</span>
    </>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="ms-auto shrink-0 rounded-badge px-1.5 text-xs text-fg-subtle numeric group-data-current/item:text-fg-muted">
      {children}
    </span>
  );
}

export type SidebarItemProps = Omit<ComponentProps<'a'>, 'children'> & {
  /** A 16px icon. Required in practice: it is all the icon rail shows. */
  icon?: ReactNode;
  /** The label, also the tooltip and accessible name in the icon rail. */
  children: ReactNode;
  /** Marks the item of the current page: tinted, announced as the current page. */
  active?: boolean;
  /** A count at the end, such as items waiting. Hidden in the icon rail. */
  badge?: ReactNode;
  /** Replaces the anchor, for a router's link: `render={<Link to="/invoices" />}`. */
  render?: ReactElement;
};

/** A link in the sidebar. Without `href` or `render` it is a button, for an action. */
export function SidebarItem({
  icon,
  children,
  active = false,
  badge,
  render,
  className,
  onClick,
  ...props
}: SidebarItemProps) {
  const collapsed = useCollapsed();
  const placement = use(PlacementContext);
  const { setMobileOpen } = useSidebar();
  const isLink = props.href !== undefined || render !== undefined;

  const element = useRender({
    defaultTagName: isLink ? 'a' : 'button',
    render,
    props: mergeProps<'a'>(
      {
        'aria-current': active ? 'page' : undefined,
        'data-current': active ? '' : undefined,
        className: cn(row, collapsed && railRow, className),
        onClick: () => {
          if (placement === 'sheet') setMobileOpen(false);
        },
        ...(isLink ? {} : { type: 'button' }),
      } as ComponentProps<'a'>,
      { ...props, onClick } as ComponentProps<'a'>,
      {
        children: (
          <>
            {icon !== undefined && <ItemIcon>{icon}</ItemIcon>}
            <span className={cn('min-w-0 flex-1 truncate text-start', collapsed && 'sr-only')}>
              {children}
            </span>
            {badge !== undefined &&
              (collapsed ? <RailBadge>{badge}</RailBadge> : <Badge>{badge}</Badge>)}
          </>
        ),
      },
    ),
  });

  return (
    <li className="flex">
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger render={element} />
          <TooltipContent side="right">
            {children}
            {badge !== undefined && <span className="ms-2 numeric opacity-70">{badge}</span>}
          </TooltipContent>
        </Tooltip>
      ) : (
        element
      )}
    </li>
  );
}

export interface SidebarSubmenuProps {
  icon?: ReactNode;
  /** The section's name, such as "Invoices". */
  label: ReactNode;
  /** `SidebarSubItem` links. */
  children: ReactNode;
  /** Open at first. Default: open when it holds the current page (`active`). */
  defaultOpen?: boolean;
  /** The current page is one of its items: the trigger is tinted too, and it starts open. */
  active?: boolean;
  badge?: ReactNode;
  className?: string;
}

/**
 * A section with nested links. Expands in place in the full sidebar; in the icon rail it opens a
 * flyout menu beside the icon instead, so nested pages stay one click away.
 */
export function SidebarSubmenu({
  icon,
  label,
  children,
  defaultOpen,
  active = false,
  badge,
  className,
}: SidebarSubmenuProps) {
  const collapsed = useCollapsed();
  const [open, setOpen] = useState(defaultOpen ?? active);

  if (collapsed) {
    return (
      <li className="flex">
        <Menu>
          <Tooltip>
            <TooltipTrigger
              render={
                <MenuTrigger
                  data-active={active ? '' : undefined}
                  className={cn(row, railRow, 'data-popup-open:bg-surface-hover', className)}
                />
              }
            >
              {icon !== undefined && <ItemIcon>{icon}</ItemIcon>}
              <span className="sr-only">{label}</span>
              {badge !== undefined && <RailBadge>{badge}</RailBadge>}
            </TooltipTrigger>
            <TooltipContent side="right">
              {label}
              {badge !== undefined && <span className="ms-2 numeric opacity-70">{badge}</span>}
            </TooltipContent>
          </Tooltip>
          <MenuContent side="right" align="start" sideOffset={8}>
            <MenuGroup label={label}>
              <FlyoutContext value>{children}</FlyoutContext>
            </MenuGroup>
          </MenuContent>
        </Menu>
      </li>
    );
  }

  return (
    <li>
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger
          data-active={active && !open ? '' : undefined}
          className={cn(row, className)}
        >
          {icon !== undefined && <ItemIcon>{icon}</ItemIcon>}
          <span className="min-w-0 flex-1 truncate text-start">{label}</span>
          {badge !== undefined && <Badge>{badge}</Badge>}
          <CaretDownIcon
            aria-hidden
            weight="bold"
            className="size-3 shrink-0 text-fg-subtle transition-transform duration-fast ease-standard group-data-panel-open/item:rotate-180"
          />
        </Collapsible.Trigger>
        <Collapsible.Panel>
          <ul className="relative ms-4 flex flex-col gap-0.5 border-s border-line py-0.5 ps-2">
            {children}
          </ul>
        </Collapsible.Panel>
      </Collapsible.Root>
    </li>
  );
}

export type SidebarSubItemProps = Omit<ComponentProps<'a'>, 'children'> & {
  children: ReactNode;
  active?: boolean;
  badge?: ReactNode;
  render?: ReactElement;
};

/** A nested link inside a `SidebarSubmenu`. */
export function SidebarSubItem({
  children,
  active = false,
  badge,
  render,
  className,
  onClick,
  ...props
}: SidebarSubItemProps) {
  const inFlyout = use(FlyoutContext);
  const placement = use(PlacementContext);
  const { setMobileOpen } = useSidebar();

  const element = useRender({
    defaultTagName: 'a',
    render,
    enabled: !inFlyout,
    props: mergeProps<'a'>(
      {
        'aria-current': active ? 'page' : undefined,
        'data-current': active ? '' : undefined,
        className: cn(row, 'h-(--rx-control-height-sm) font-regular', className),
        onClick: () => {
          if (placement === 'sheet') setMobileOpen(false);
        },
      } as ComponentProps<'a'>,
      { ...props, onClick } as ComponentProps<'a'>,
      {
        children: (
          <>
            <span className="min-w-0 flex-1 truncate">{children}</span>
            {badge !== undefined && <Badge>{badge}</Badge>}
          </>
        ),
      },
    ),
  });

  if (inFlyout) {
    return (
      <MenuLinkItem
        href={props.href}
        render={render}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className="aria-[current=page]:font-medium"
      >
        {children}
      </MenuLinkItem>
    );
  }
  return <li className="flex">{element}</li>;
}

export type SidebarTriggerProps = Omit<ComponentProps<'button'>, 'children'> & {
  /** Names for each state. */
  labels?: { collapse: string; expand: string; open: string };
};

/**
 * Folds and unfolds the rail on desktop, opens the sheet on a phone. Shows the shortcut in its
 * tooltip.
 */
export function SidebarTrigger({
  className,
  labels = { collapse: 'Collapse sidebar', expand: 'Expand sidebar', open: 'Open navigation' },
  onClick,
  ...props
}: SidebarTriggerProps) {
  const { collapsed, mobile, mobileOpen, toggle, shortcut } = useSidebar();
  const label = mobile ? labels.open : collapsed ? labels.expand : labels.collapse;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            // On desktop the label names the action, which already says the state; the phone
            // trigger keeps one name and reports whether the sheet is open.
            aria-expanded={mobile ? mobileOpen : undefined}
            data-slot="sidebar-trigger"
            className={cn(
              'relative inline-flex size-(--rx-button-height-md) shrink-0 cursor-pointer items-center justify-center',
              'rounded-(--rx-button-radius) text-fg-muted hover:bg-surface-hover hover:text-fg',
              'transition-colors duration-fast ease-standard',
              'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
              touchHitArea,
              className,
            )}
            onClick={(event) => {
              onClick?.(event);
              if (!event.defaultPrevented) toggle();
            }}
            {...props}
          />
        }
      >
        <SidebarSimpleIcon aria-hidden weight="bold" className="size-4.5 rtl:-scale-x-100" />
      </TooltipTrigger>
      <TooltipContent side="bottom" {...(shortcut === null || mobile ? {} : { shortcut })}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/** The column beside the sidebar: the header and the page. */
export function SidebarInset({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn('flex min-w-0 flex-1 flex-col', className)}
      {...props}
    />
  );
}

import { NavigationMenu as BaseNavigationMenu } from '@base-ui/react/navigation-menu';
import { CaretDownIcon, ListIcon } from '@phosphor-icons/react';
import { useState, type ComponentProps, type ReactNode } from 'react';

import { cn, touchHitArea } from '../lib/cn';
import { popoverSurface } from '../popover/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../sheet/sheet';
import { usePortalContainer } from '../theme-scope/theme-scope';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

export type NavigationMenuProps = WithClassName<ComponentProps<typeof BaseNavigationMenu.Root>> & {
  children: ReactNode;
};

/**
 * Top navigation with dropdown panels. Panels open on hover after a short delay, or on click,
 * Enter, Space or ArrowDown; Escape closes and returns focus to the trigger. One popup is shared
 * by every panel, so moving between triggers swaps the content in place.
 */
export function NavigationMenu({ className, children, ...props }: NavigationMenuProps) {
  const container = usePortalContainer();
  return (
    <BaseNavigationMenu.Root
      data-slot="navigation-menu"
      className={cn('relative min-w-0', className)}
      {...props}
    >
      {children}
      <BaseNavigationMenu.Portal container={container}>
        <BaseNavigationMenu.Positioner
          sideOffset={8}
          collisionPadding={8}
          collisionAvoidance={{ side: 'none' }}
          className={cn(
            'z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width)',
            // A bridge over the gap, so the pointer can travel from trigger to panel without closing it.
            'before:absolute before:inset-x-0 before:-top-2 before:h-2',
          )}
        >
          <BaseNavigationMenu.Popup
            data-slot="navigation-menu-popup"
            className={cn(
              'relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) overflow-hidden',
              popoverSurface,
              'transition-[opacity,scale] duration-base ease-enter',
              'data-starting-style:scale-(--rx-motion-scale-from) data-starting-style:opacity-0',
              'data-ending-style:opacity-0 data-ending-style:duration-fast data-ending-style:ease-exit',
            )}
          >
            <BaseNavigationMenu.Viewport className="relative size-full overflow-hidden" />
          </BaseNavigationMenu.Popup>
        </BaseNavigationMenu.Positioner>
      </BaseNavigationMenu.Portal>
    </BaseNavigationMenu.Root>
  );
}

export type NavigationMenuListProps = WithClassName<ComponentProps<typeof BaseNavigationMenu.List>>;

export function NavigationMenuList({ className, ...props }: NavigationMenuListProps) {
  return (
    <BaseNavigationMenu.List className={cn('flex items-center gap-0.5', className)} {...props} />
  );
}

export const NavigationMenuItem = BaseNavigationMenu.Item;

const topLevel = cn(
  'relative inline-flex h-(--rx-button-height-md) cursor-pointer items-center gap-1.5 rounded-(--rx-button-radius) px-3',
  'text-sm font-medium text-fg-muted no-underline select-none',
  'transition-colors duration-fast ease-standard hover:bg-surface-hover hover:text-fg',
  'data-popup-open:bg-surface-hover data-popup-open:text-fg',
  'aria-[current=page]:text-fg',
  '-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
  'pointer-coarse:h-(--rx-button-height-touch)',
);

export type NavigationMenuTriggerProps = WithClassName<
  ComponentProps<typeof BaseNavigationMenu.Trigger>
>;

/** A top-level item that opens a panel. */
export function NavigationMenuTrigger({
  className,
  children,
  ...props
}: NavigationMenuTriggerProps) {
  return (
    <BaseNavigationMenu.Trigger className={cn(topLevel, className)} {...props}>
      {children}
      <BaseNavigationMenu.Icon className="flex text-fg-subtle transition-transform duration-fast ease-standard data-popup-open:rotate-180">
        <CaretDownIcon aria-hidden weight="bold" className="size-3" />
      </BaseNavigationMenu.Icon>
    </BaseNavigationMenu.Trigger>
  );
}

export type NavigationMenuContentProps = WithClassName<
  ComponentProps<typeof BaseNavigationMenu.Content>
>;

/** A panel. It cross-fades with the panel it replaces when the pointer moves to another trigger. */
export function NavigationMenuContent({ className, ...props }: NavigationMenuContentProps) {
  return (
    <BaseNavigationMenu.Content
      data-slot="navigation-menu-content"
      className={cn(
        'w-(--rx-navigation-menu-panel-width) max-w-full p-2',
        'transition-opacity duration-fast ease-standard data-starting-style:opacity-0 data-ending-style:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

export type NavigationMenuLinkProps = WithClassName<
  ComponentProps<typeof BaseNavigationMenu.Link>
> & {
  /** Marks the link of the current page. */
  active?: boolean;
};

/** A top-level link with no panel. Pass `render` for a router's link. */
export function NavigationMenuLink({ className, active, ...props }: NavigationMenuLinkProps) {
  return (
    <BaseNavigationMenu.Link
      active={active}
      aria-current={active === true ? 'page' : undefined}
      className={cn(topLevel, className)}
      {...props}
    />
  );
}

export type NavigationMenuPanelLinkProps = WithClassName<
  ComponentProps<typeof BaseNavigationMenu.Link>
> & {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
};

/** A link inside a panel: a title, one line of description and an optional icon. */
export function NavigationMenuPanelLink({
  className,
  title,
  description,
  icon,
  ...props
}: NavigationMenuPanelLinkProps) {
  return (
    <BaseNavigationMenu.Link
      className={cn(
        'flex gap-3 rounded-control p-2.5 text-start no-underline',
        'transition-colors duration-fast ease-standard hover:bg-surface-hover',
        '-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        className,
      )}
      {...props}
    >
      {icon !== undefined && (
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-fg-muted"
        >
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-fg">{title}</span>
        {description !== undefined && <span className="text-sm text-fg-muted">{description}</span>}
      </span>
    </BaseNavigationMenu.Link>
  );
}

export interface NavigationBarProps extends Omit<ComponentProps<'header'>, 'title'> {
  /** The product mark or name, usually a link home. */
  brand: ReactNode;
  /** The desktop navigation, usually a `NavigationMenu`. Hidden below the medium breakpoint. */
  children?: ReactNode;
  /** Search, notifications, the account menu. Always visible. */
  actions?: ReactNode;
  /**
   * The phone navigation: what the menu button opens in a sheet from the left. Receives a `close`
   * function to call after a link is followed.
   */
  mobileMenu?: (close: () => void) => ReactNode;
  /** Name of the phone menu button and the sheet's title. */
  mobileMenuLabel?: string;
}

/**
 * A top bar: brand, navigation and actions on one line. Below the medium breakpoint the navigation
 * folds into a menu button that opens a sheet.
 */
export function NavigationBar({
  brand,
  children,
  actions,
  mobileMenu,
  mobileMenuLabel = 'Menu',
  className,
  ...props
}: NavigationBarProps) {
  const [open, setOpen] = useState(false);
  return (
    <header
      data-slot="navigation-bar"
      className={cn(
        'flex h-(--rx-app-shell-header-height) items-center gap-4 border-b border-line bg-surface px-4 text-fg',
        className,
      )}
      {...props}
    >
      {mobileMenu !== undefined && (
        <Sheet side="left" open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label={mobileMenuLabel}
            className={cn(
              'relative -ms-1.5 inline-flex size-(--rx-button-height-md) cursor-pointer items-center justify-center md:hidden',
              'rounded-(--rx-button-radius) text-fg-muted hover:bg-surface-hover hover:text-fg',
              'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
              touchHitArea,
            )}
          >
            <ListIcon aria-hidden weight="bold" className="size-5" />
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{mobileMenuLabel}</SheetTitle>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4">
              {mobileMenu(() => {
                setOpen(false);
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}
      <div className="flex shrink-0 items-center">{brand}</div>
      {children !== undefined && <div className="hidden min-w-0 flex-1 md:flex">{children}</div>}
      {actions !== undefined && (
        <div className="ms-auto flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

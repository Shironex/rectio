import { Dialog } from '@base-ui/react/dialog';
import { ListIcon, XIcon } from '@phosphor-icons/react';
import { cn, usePortalContainer } from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import {
  ActionLink,
  Anchor,
  linkFocus,
  type MarketingAction,
  type MarketingLink,
} from '../lib/action';
import { Container } from '../lib/section';

export interface SiteHeaderProps {
  /** Your logo and name. It links home through `brandHref`. */
  brand: ReactNode;
  /** Accessible name of the home link, such as "Northlake home". */
  brandLabel: string;
  brandHref?: string;
  links: readonly MarketingLink[];
  /** The current page's href: its link is marked `aria-current="page"`. */
  currentHref?: string;
  /** The main action, such as "Start free", and a quieter one, such as "Sign in". */
  primary?: MarketingAction;
  secondary?: MarketingAction;
  /** Stick to the top of the viewport as the page scrolls. */
  sticky?: boolean;
  /** Label of the button that opens the menu on narrow screens. */
  menuLabel?: string;
  className?: string;
}

const NAV_LINK = cn(
  'inline-flex h-9 items-center px-3 text-base text-fg-muted transition-colors duration-fast ease-standard',
  'pointer-fine:hover:text-fg aria-[current=page]:text-fg aria-[current=page]:font-medium',
  linkFocus,
);

/**
 * The bar at the top of every page: brand, a single line of links and the main action. Below the
 * `md` breakpoint the links move into a menu that opens as a sheet under the bar, traps focus,
 * closes on Escape or a link press, and returns focus to its button.
 */
export function SiteHeader({
  brand,
  brandLabel,
  brandHref = '/',
  links,
  currentHref,
  primary,
  secondary,
  sticky = true,
  menuLabel = 'Menu',
  className,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const container = usePortalContainer();
  const current = (href: string) => (href === currentHref ? ('page' as const) : undefined);
  return (
    <header
      data-slot="site-header"
      className={cn(
        'z-40 border-b border-line bg-surface-canvas/90 text-fg',
        'supports-backdrop-filter:bg-surface-canvas/75 supports-backdrop-filter:backdrop-blur-md',
        sticky && 'sticky top-0',
        className,
      )}
    >
      <Container width="wide" className="flex h-16 items-center gap-6">
        <Anchor
          href={brandHref}
          aria-label={brandLabel}
          className={cn(
            'inline-flex min-h-(--rx-button-height-touch) shrink-0 items-center',
            linkFocus,
          )}
        >
          {brand}
        </Anchor>
        <nav aria-label="Main" className="hidden min-w-0 flex-1 md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Anchor
                  href={link.href}
                  external={link.external}
                  aria-current={current(link.href)}
                  className={NAV_LINK}
                >
                  {link.label}
                </Anchor>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ms-auto hidden items-center gap-2 md:flex">
          {secondary !== undefined && <ActionLink action={secondary} variant="ghost" size="md" />}
          {primary !== undefined && <ActionLink action={primary} size="md" />}
        </div>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger
            aria-label={menuLabel}
            className={cn(
              'relative ms-auto inline-flex size-10 cursor-pointer items-center justify-center rounded-control text-fg md:hidden',
              'pointer-fine:hover:bg-surface-hover pointer-coarse:size-(--rx-button-height-touch)',
              'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
            )}
          >
            <ListIcon aria-hidden weight="bold" className="size-5" />
          </Dialog.Trigger>
          <Dialog.Portal container={container}>
            <Dialog.Backdrop
              className={cn(
                'fixed inset-0 z-50 bg-scrim transition-opacity duration-base ease-standard',
                'data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-fast',
              )}
            />
            <Dialog.Popup
              data-slot="site-menu"
              className={cn(
                'fixed inset-x-0 top-0 z-50 flex max-h-dvh flex-col overflow-y-auto border-b border-line bg-surface-overlay text-fg shadow-overlay outline-none',
                'transition-[opacity,translate] duration-slow ease-enter',
                'data-starting-style:-translate-y-(--rx-motion-distance-reveal) data-starting-style:opacity-0',
                'data-ending-style:opacity-0 data-ending-style:duration-fast data-ending-style:ease-exit',
              )}
            >
              <Dialog.Title className="sr-only">{menuLabel}</Dialog.Title>
              <div className="flex h-16 items-center justify-between px-4">
                <span aria-hidden className="inline-flex items-center">
                  {brand}
                </span>
                <Dialog.Close
                  aria-label="Close menu"
                  className={cn(
                    'inline-flex size-(--rx-button-height-touch) cursor-pointer items-center justify-center rounded-control text-fg',
                    'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
                  )}
                >
                  <XIcon aria-hidden weight="bold" className="size-5" />
                </Dialog.Close>
              </div>
              <nav aria-label="Main" className="px-2 pb-2">
                <ul className="flex flex-col">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Anchor
                        href={link.href}
                        external={link.external}
                        aria-current={current(link.href)}
                        onClick={() => {
                          setOpen(false);
                        }}
                        className={cn(
                          'flex min-h-(--rx-button-height-touch) items-center px-3 text-xl text-fg',
                          'aria-[current=page]:font-strong',
                          linkFocus,
                        )}
                      >
                        {link.label}
                      </Anchor>
                    </li>
                  ))}
                </ul>
              </nav>
              {(primary !== undefined || secondary !== undefined) && (
                <div className="grid gap-2 border-t border-line p-4">
                  {primary !== undefined && <ActionLink action={primary} className="w-full" />}
                  {secondary !== undefined && (
                    <ActionLink action={secondary} variant="secondary" className="w-full" />
                  )}
                </div>
              )}
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </Container>
    </header>
  );
}

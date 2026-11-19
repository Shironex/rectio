import { Collapsible } from '@base-ui/react/collapsible';
import { CaretRightIcon, ListIcon } from '@phosphor-icons/react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger, cn } from '@rectio/ui';
import { useCallback, useState, type ReactNode } from 'react';

import { isSamePage } from '../lib/docs';
import { DocsLink, linkFocus } from '../lib/link';
import { CloseNavContext } from '../lib/nav-context';

export interface DocsHeaderLink {
  label: string;
  href: string;
  external?: boolean | undefined;
}

export interface DocsHeaderProps {
  /** Your logo and the product's name. It links home through `brandHref`. */
  brand: ReactNode;
  /** Accessible name of the home link, such as "Halyard docs home". */
  brandLabel: string;
  brandHref?: string;
  /** A few top-level destinations, such as Docs, API, Changelog, Blog. */
  links?: readonly DocsHeaderLink[];
  /** Marks the matching top link as current. */
  currentHref?: string | undefined;
  /** The search trigger, usually a `DocsSearch`. */
  search?: ReactNode;
  /** The end of the bar: version and language switchers, theme switch, a GitHub link. */
  actions?: ReactNode;
  /**
   * The navigation for phones and tablets, usually the same `DocsSidebar` as the layout's. It
   * opens in a sheet from the start edge and closes after a link press.
   */
  mobileNav?: ReactNode;
  menuLabel?: string;
  className?: string;
}

/**
 * The bar across the top of every docs page: brand, a few top links, search, and switchers. Below
 * the large breakpoint a menu button opens the navigation in a sheet.
 */
export function DocsHeader({
  brand,
  brandLabel,
  brandHref = '/',
  links,
  currentHref,
  search,
  actions,
  mobileNav,
  menuLabel = 'Navigation',
  className,
}: DocsHeaderProps) {
  const [open, setOpen] = useState(false);
  const closeNav = useCallback(() => {
    setOpen(false);
  }, []);
  return (
    <header
      data-slot="docs-header"
      className={cn(
        'sticky top-0 z-40 border-b border-line bg-surface-canvas/90 text-fg',
        'supports-backdrop-filter:bg-surface-canvas/80 supports-backdrop-filter:backdrop-blur-md',
        className,
      )}
    >
      <div className="flex h-(--rx-app-shell-header-height) items-center gap-3 px-4 sm:px-6">
        {mobileNav !== undefined && (
          <Sheet side="left" open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label={menuLabel}
              className={cn(
                'relative -ms-1.5 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-fg lg:hidden',
                'pointer-fine:hover:bg-surface-hover pointer-coarse:size-(--rx-button-height-touch)',
                'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
              )}
            >
              <ListIcon aria-hidden weight="bold" className="size-5" />
            </SheetTrigger>
            <SheetContent className="w-80">
              <SheetTitle className="sr-only">{menuLabel}</SheetTitle>
              <div className="flex h-(--rx-app-shell-header-height) shrink-0 items-center border-b border-line px-4">
                <span aria-hidden className="inline-flex items-center">
                  {brand}
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5">
                <CloseNavContext value={closeNav}>{mobileNav}</CloseNavContext>
              </div>
            </SheetContent>
          </Sheet>
        )}
        <DocsLink
          href={brandHref}
          aria-label={brandLabel}
          className={cn('inline-flex min-h-9 shrink-0 items-center', linkFocus)}
        >
          {brand}
        </DocsLink>
        {links !== undefined && links.length > 0 && (
          <nav aria-label="Main" className="ms-4 hidden md:block">
            <ul className="flex items-center gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <DocsLink
                    href={link.href}
                    external={link.external}
                    aria-current={
                      currentHref !== undefined && isSamePage(link.href, currentHref)
                        ? 'page'
                        : undefined
                    }
                    className={cn(
                      'inline-flex h-9 items-center rounded-control px-2.5 text-sm text-fg-muted transition-colors duration-fast ease-standard',
                      'pointer-fine:hover:text-fg aria-[current=page]:font-medium aria-[current=page]:text-fg',
                      linkFocus,
                    )}
                  >
                    {link.label}
                  </DocsLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
          {search}
          {actions}
        </div>
      </div>
    </header>
  );
}

export interface DocsLayoutProps {
  /** The bar at the top, usually a `DocsHeader`. */
  header: ReactNode;
  /** The navigation on the start side, usually a `DocsSidebar`. Hidden below the large breakpoint. */
  sidebar?: ReactNode;
  /**
   * On this page, usually a `DocsToc`. A column on the end side on extra large screens; above the
   * content in a disclosure on smaller ones.
   */
  toc?: ReactNode;
  /** Label of the small-screen disclosure that holds the table of contents. */
  tocLabel?: string;
  /** Above the page, inside the content column: a breadcrumb. */
  top?: ReactNode;
  /** Under the page, inside the content column: edit link, feedback, previous and next. */
  bottom?: ReactNode;
  /** Under everything, full width: a site footer. */
  footer?: ReactNode;
  /** Lets the content run wider, for a home page or a changelog without a table of contents. */
  wide?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * The frame of a docs site: the header across the top, the navigation down the start edge, the
 * page at a reading measure, and the table of contents down the end edge. Each column scrolls with
 * the page and stays in view; a skip link jumps straight to the content.
 */
export function DocsLayout({
  header,
  sidebar,
  toc,
  tocLabel = 'On this page',
  top,
  bottom,
  footer,
  wide = false,
  children,
  className,
}: DocsLayoutProps) {
  return (
    <div
      data-slot="docs-layout"
      className={cn('flex min-h-dvh flex-col bg-surface-canvas text-fg', className)}
    >
      <a
        href="#docs-content"
        className={cn(
          'fixed start-3 top-3 z-50 -translate-y-24 rounded-control bg-surface-overlay px-3 py-2 text-sm font-medium text-fg shadow-overlay',
          'focus-visible:translate-y-0 focus-visible:outline-2 focus-visible:outline-focus',
        )}
      >
        Skip to content
      </a>
      {header}
      <div className="flex flex-1">
        {sidebar !== undefined && (
          // The rule runs the full height of the page; the column inside it stays in view.
          <div className="hidden w-72 shrink-0 border-e border-line lg:block">
            <aside
              data-slot="docs-layout-sidebar"
              // Starts behind the sticky header and pads under it, so the column fills the
              // viewport at every scroll position without a computed height.
              className="sticky top-0 -mt-(--rx-app-shell-header-height) flex h-dvh flex-col pt-(--rx-app-shell-header-height)"
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-8">
                {sidebar}
              </div>
            </aside>
          </div>
        )}
        <div className="flex min-w-0 flex-1 justify-center gap-12 px-4 sm:px-8 xl:px-12">
          <main
            id="docs-content"
            tabIndex={-1}
            className={cn(
              'flex w-full min-w-0 flex-col pt-8 pb-16 outline-none sm:pt-10',
              wide ? 'max-w-6xl' : 'max-w-3xl',
            )}
          >
            {top !== undefined && <div className="mb-6">{top}</div>}
            {toc !== undefined && (
              <Collapsible.Root className="mb-8 rounded-panel border border-line xl:hidden">
                <Collapsible.Trigger
                  className={cn(
                    'group/toc flex min-h-11 w-full cursor-pointer items-center gap-2 px-4 text-sm font-medium text-fg',
                    'rounded-panel outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
                  )}
                >
                  <CaretRightIcon
                    aria-hidden
                    weight="bold"
                    className="size-3.5 text-fg-subtle transition-transform duration-base ease-standard group-data-panel-open/toc:rotate-90 motion-reduce:transition-none rtl:-scale-x-100"
                  />
                  {tocLabel}
                </Collapsible.Trigger>
                <Collapsible.Panel className="border-t border-line px-4 py-3 [&_nav>p]:hidden">
                  {toc}
                </Collapsible.Panel>
              </Collapsible.Root>
            )}
            <div className="min-w-0 flex-1">{children}</div>
            {bottom !== undefined && (
              <div className="mt-16 flex flex-col gap-8 border-t border-line pt-8">{bottom}</div>
            )}
          </main>
          {toc !== undefined && (
            <aside
              data-slot="docs-layout-toc"
              className="sticky top-(--rx-app-shell-header-height) hidden max-h-dvh w-56 shrink-0 self-start overflow-y-auto pt-10 pb-24 xl:block"
            >
              {toc}
            </aside>
          )}
        </div>
      </div>
      {footer}
    </div>
  );
}

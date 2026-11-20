import { CaretRightIcon, DotsThreeIcon } from '@phosphor-icons/react';
import { isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react';

import { cn, touchHitArea } from '../lib/cn';
import { Menu, MenuContent, MenuItem, MenuLinkItem, MenuTrigger } from '../menu/menu';

export interface BreadcrumbItem {
  label: ReactNode;
  /** Omit on the last item, the current page. */
  href?: string;
  /** Unique key; falls back to `href`, then the position. */
  id?: string;
}

export interface BreadcrumbLinkProps {
  href: string;
  className: string;
  children: ReactNode;
}

export interface BreadcrumbProps extends Omit<ComponentProps<'nav'>, 'children'> {
  /** From the root to the current page. The last item is the current page. */
  items: readonly BreadcrumbItem[];
  /**
   * Most items to show. Beyond it the middle collapses into a menu, keeping the first item and the
   * last `maxItems - 2`. Default 4; 2 or 3 suits a phone.
   */
  maxItems?: number;
  /**
   * Below the small breakpoint, show only the current page after a menu of every level above it.
   * Default true.
   */
  collapseOnPhone?: boolean;
  /**
   * Draws a visible link, for a router's link component. Defaults to an anchor. Collapsed levels in
   * the menu are plain anchors.
   */
  renderLink?: (props: BreadcrumbLinkProps) => ReactNode;
  /** Name of the landmark. Default "Breadcrumb". */
  label?: string;
  /** Name of the button that shows the collapsed items. */
  moreLabel?: string;
}

const linkStyle = cn(
  'rounded-control text-fg-muted underline-offset-4 transition-colors duration-fast ease-standard',
  'hover:text-fg hover:underline',
  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
  // A trail is not running text: on touch each level is a full-height target.
  'pointer-coarse:py-3',
);

const defaultLink = ({ href, className, children }: BreadcrumbLinkProps) => (
  <a href={href} className={className}>
    {children}
  </a>
);

/** Which items are shown, and the collapsed run between them, for `maxItems`. */
export function collapseBreadcrumb<T>(
  items: readonly T[],
  maxItems: number,
): { head: T[]; hidden: T[]; tail: T[] } {
  const max = Math.max(2, Math.floor(maxItems));
  if (items.length <= max) return { head: [...items], hidden: [], tail: [] };
  const tailCount = max - 1;
  return {
    head: items.slice(0, 1),
    hidden: items.slice(1, items.length - tailCount),
    tail: items.slice(items.length - tailCount),
  };
}

function Separator({ className }: { className?: string | undefined }) {
  return (
    <li role="presentation" aria-hidden className={cn('flex text-fg-subtle', className)}>
      <CaretRightIcon weight="bold" className="size-3 rtl:rotate-180" />
    </li>
  );
}

/** A rendered link as an element Base UI can merge its props into, or nothing to use the default. */
function asElement(node: ReactNode): ReactElement | undefined {
  return isValidElement(node) ? (node as ReactElement) : undefined;
}

function HiddenLevels({
  items,
  label,
  keyOf,
  renderLink,
  className,
}: {
  items: readonly BreadcrumbItem[];
  label: string;
  keyOf: (item: BreadcrumbItem, index: number) => string;
  renderLink: (props: BreadcrumbLinkProps) => ReactNode;
  className?: string | undefined;
}) {
  return (
    <li className={cn('flex', className)}>
      <Menu>
        <MenuTrigger
          aria-label={label}
          // The dots alone say nothing to a sighted pointer user; the name shows on hover too.
          title={label}
          className={cn(
            'relative inline-flex h-6 w-7 cursor-pointer items-center justify-center rounded-control text-fg-muted',
            'hover:bg-surface-hover hover:text-fg data-popup-open:bg-surface-hover',
            'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
            touchHitArea,
          )}
        >
          <DotsThreeIcon aria-hidden weight="bold" className="size-4" />
        </MenuTrigger>
        <MenuContent>
          {items.map((item, i) =>
            item.href === undefined ? (
              <MenuItem key={keyOf(item, i)} disabled>
                {item.label}
              </MenuItem>
            ) : (
              <MenuLinkItem
                key={keyOf(item, i)}
                href={item.href}
                // The app's router link, so a hidden level navigates like a shown one.
                render={asElement(
                  renderLink({ href: item.href, className: '', children: item.label }),
                )}
              >
                {item.label}
              </MenuLinkItem>
            ),
          )}
        </MenuContent>
      </Menu>
    </li>
  );
}

/**
 * Where the current page sits. Each level is a link except the last, which is marked as the current
 * page. A long trail collapses its middle into a menu instead of wrapping; on a phone only the
 * current page shows, after a menu of every level above it.
 */
export function Breadcrumb({
  items,
  maxItems = 4,
  collapseOnPhone = true,
  renderLink = defaultLink,
  label = 'Breadcrumb',
  moreLabel = 'Show hidden levels',
  className,
  ...props
}: BreadcrumbProps) {
  const { head, hidden, tail } = collapseBreadcrumb(items, maxItems);
  const last = items.length - 1;
  const keyOf = (item: BreadcrumbItem, index: number) => item.id ?? item.href ?? String(index);
  // On a phone every level but the current one moves into the leading menu.
  const phone = collapseOnPhone && items.length > 1;
  const desktopOnly = phone ? 'max-sm:hidden' : undefined;

  const crumb = (item: BreadcrumbItem, index: number) => (
    <li
      key={keyOf(item, index)}
      className={cn('flex min-w-0 items-center', index !== last && desktopOnly)}
    >
      {index === last || item.href === undefined ? (
        <span
          aria-current={index === last ? 'page' : undefined}
          className={cn('truncate', index === last ? 'font-medium text-fg' : 'text-fg-muted')}
        >
          {item.label}
        </span>
      ) : (
        renderLink({ href: item.href, className: cn(linkStyle, 'truncate'), children: item.label })
      )}
    </li>
  );

  const shown = head.map((item) => ({ item, index: items.indexOf(item) }));
  const after = tail.map((item) => ({ item, index: items.indexOf(item) }));

  return (
    <nav aria-label={label} data-slot="breadcrumb" className={cn('min-w-0', className)} {...props}>
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {phone && (
          <>
            <HiddenLevels
              items={items.slice(0, last)}
              label={moreLabel}
              keyOf={keyOf}
              renderLink={renderLink}
              className="sm:hidden"
            />
            <Separator className="sm:hidden" />
          </>
        )}
        {shown.flatMap(({ item, index }, i) => [
          ...(i > 0
            ? [<Separator key={`sep-${keyOf(item, index)}`} className={desktopOnly} />]
            : []),
          crumb(item, index),
        ])}
        {hidden.length > 0 && (
          <>
            <Separator className={desktopOnly} />
            <HiddenLevels
              items={hidden}
              label={moreLabel}
              keyOf={keyOf}
              renderLink={renderLink}
              className={desktopOnly}
            />
          </>
        )}
        {after.flatMap(({ item, index }) => [
          <Separator key={`sep-${keyOf(item, index)}`} className={desktopOnly} />,
          crumb(item, index),
        ])}
      </ol>
    </nav>
  );
}

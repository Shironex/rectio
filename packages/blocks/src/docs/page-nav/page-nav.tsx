import { ArrowLeftIcon, ArrowRightIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { Breadcrumb, cn, type BreadcrumbItem } from '@rectio/ui';
import type { ReactNode } from 'react';

import { formatDate, isoDate, type DocsPageLink } from '../lib/docs';
import { DocsLink, linkFocus } from '../lib/link';

export interface DocsPagerProps {
  prev?: DocsPageLink | null | undefined;
  next?: DocsPageLink | null | undefined;
  /** Words above each title, for translation. */
  labels?: { prev?: string; next?: string };
  className?: string;
}

/**
 * Previous and next page at the foot of a page, in reading order. Each is one large link with its
 * direction in words above the title; `pagerFor` works them out from the navigation.
 */
export function DocsPager({ prev, next, labels, className }: DocsPagerProps) {
  if ((prev ?? null) === null && (next ?? null) === null) return null;
  return (
    <nav
      aria-label="Previous and next page"
      data-slot="docs-pager"
      className={cn('grid gap-3 sm:grid-cols-2', className)}
    >
      {prev !== null && prev !== undefined ? (
        <PagerLink page={prev} direction="prev" label={labels?.prev ?? 'Previous'} />
      ) : (
        <span aria-hidden className="max-sm:hidden" />
      )}
      {next !== null && next !== undefined && (
        <PagerLink page={next} direction="next" label={labels?.next ?? 'Next'} />
      )}
    </nav>
  );
}

function PagerLink({
  page,
  direction,
  label,
}: {
  page: DocsPageLink;
  direction: 'prev' | 'next';
  label: string;
}) {
  const Arrow = direction === 'prev' ? ArrowLeftIcon : ArrowRightIcon;
  return (
    <DocsLink
      href={page.href}
      rel={direction}
      className={cn(
        'group/pager flex flex-col gap-1 rounded-panel border border-line px-4 py-3.5',
        'transition-colors duration-fast ease-standard pointer-fine:hover:border-line-strong pointer-fine:hover:bg-surface-hover',
        direction === 'next' && 'sm:col-start-2 sm:items-end sm:text-end',
        linkFocus,
      )}
    >
      <span className="flex items-center gap-1.5 text-sm text-fg-subtle">
        {direction === 'prev' && (
          <Arrow
            aria-hidden
            weight="bold"
            className="size-3.5 transition-transform duration-fast ease-standard pointer-fine:group-hover/pager:-translate-x-0.5 rtl:-scale-x-100"
          />
        )}
        {label}
        {direction === 'next' && (
          <Arrow
            aria-hidden
            weight="bold"
            className="size-3.5 transition-transform duration-fast ease-standard pointer-fine:group-hover/pager:translate-x-0.5 rtl:-scale-x-100"
          />
        )}
      </span>
      <span className="text-base font-medium text-pretty text-fg">{page.title}</span>
      {page.section !== undefined && <span className="text-sm text-fg-subtle">{page.section}</span>}
    </DocsLink>
  );
}

export interface DocsBreadcrumbProps {
  /** From the docs home to the current page; the last item is the current page. */
  items: readonly BreadcrumbItem[];
  className?: string;
}

/** Where the page sits in the docs, with links through the router via `DocsLinkProvider`. */
export function DocsBreadcrumb({ items, className }: DocsBreadcrumbProps) {
  return (
    <Breadcrumb
      items={items}
      maxItems={4}
      className={cn('text-sm', className)}
      renderLink={({ href, className: linkClass, children }) => (
        <DocsLink href={href} className={linkClass}>
          {children}
        </DocsLink>
      )}
    />
  );
}

export interface DocsPageMetaProps {
  /** Where the page's source can be edited, such as its file on GitHub. */
  editHref?: string | undefined;
  editLabel?: string;
  /** When the page last changed: an ISO date or a Date. */
  lastUpdated?: string | Date | undefined;
  lastUpdatedLabel?: string;
  locale?: string | undefined;
  /** Something else for the row, such as the feedback widget. */
  children?: ReactNode;
  className?: string;
}

/** The row under a page: edit this page, and when it last changed. */
export function DocsPageMeta({
  editHref,
  editLabel = 'Edit this page',
  lastUpdated,
  lastUpdatedLabel = 'Last updated',
  locale,
  children,
  className,
}: DocsPageMetaProps) {
  if (editHref === undefined && lastUpdated === undefined && children === undefined) return null;
  return (
    <div
      data-slot="docs-page-meta"
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm',
        className,
      )}
    >
      {editHref !== undefined && (
        <DocsLink
          href={editHref}
          external
          className={cn(
            'inline-flex items-center gap-1.5 text-fg-muted transition-colors duration-fast ease-standard pointer-fine:hover:text-fg',
            'pointer-coarse:min-h-(--rx-control-height-touch)',
            linkFocus,
          )}
        >
          <PencilSimpleIcon aria-hidden weight="bold" className="size-4" />
          {editLabel}
          <span className="sr-only">(opens in a new tab)</span>
        </DocsLink>
      )}
      {lastUpdated !== undefined && (
        <p className="text-fg-subtle">
          {lastUpdatedLabel}{' '}
          <time dateTime={isoDate(lastUpdated)} className="text-fg-muted">
            {formatDate(lastUpdated, locale)}
          </time>
        </p>
      )}
      {children}
    </div>
  );
}

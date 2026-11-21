'use client';

import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { ComponentProps, ReactNode } from 'react';

import { cn, touchHitArea } from '../lib/cn';
import { Anchor } from '../link/link';
import { paginationRange } from './page-range';

export { paginationRange, type PageRangeItem } from './page-range';

export interface PaginationProps extends Omit<ComponentProps<'nav'>, 'onChange'> {
  /** The current page, from 1. */
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  /** Pages shown on each side of the current one. Default 1. */
  siblings?: number;
  /**
   * `full`: page numbers. `compact`: previous, "Page 3 of 12", next, for a phone or a narrow panel.
   * `responsive` (default): compact below the small breakpoint, full above.
   */
  variant?: 'full' | 'compact' | 'responsive';
  /** Make each page a link (to keep the page in the URL). Without it, pages are buttons. */
  getHref?: (page: number) => string;
  /** Name of the landmark. Default "Pagination". */
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  /** Text of the compact status. Default "Page 3 of 12". */
  formatStatus?: (page: number, pageCount: number) => ReactNode;
  /** Accessible name of a page control. Default "Page 3". */
  formatPageLabel?: (page: number) => string;
}

const control = cn(
  'relative inline-flex h-(--rx-button-height-sm) min-w-(--rx-button-height-sm) cursor-pointer items-center justify-center gap-1',
  'rounded-(--rx-button-radius) px-2 text-sm font-medium text-fg-muted numeric',
  'transition-colors duration-fast ease-standard hover:bg-surface-hover hover:text-fg',
  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
  'aria-disabled:cursor-default aria-disabled:text-fg-disabled aria-disabled:hover:bg-transparent',
  touchHitArea,
);

const currentStyle =
  'bg-surface-selected text-fg ring-1 ring-line-strong ring-inset hover:bg-surface-selected';

/**
 * Moves through pages of a list. The current page is marked for assistive technology; previous and
 * next stay in place and are disabled at the ends instead of disappearing.
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblings = 1,
  variant = 'responsive',
  getHref,
  label = 'Pagination',
  previousLabel = 'Previous',
  nextLabel = 'Next',
  formatStatus = (p, total) => `Page ${String(p)} of ${String(total)}`,
  formatPageLabel = (p) => `Page ${String(p)}`,
  className,
  ...props
}: PaginationProps) {
  const total = Math.max(1, Math.floor(pageCount));
  const current = Math.min(Math.max(1, Math.floor(page)), total);

  const pageControl = (
    target: number,
    content: ReactNode,
    extra: { label?: string; disabled?: boolean; current?: boolean; className?: string },
  ) => {
    const common = {
      'aria-label': extra.label,
      'aria-current': extra.current === true ? ('page' as const) : undefined,
      className: cn(control, extra.current === true && currentStyle, extra.className),
    };
    if (extra.disabled === true) {
      // Stays in place and in the tab order, announced as unavailable, instead of vanishing.
      return getHref === undefined ? (
        <button type="button" aria-disabled="true" {...common}>
          {content}
        </button>
      ) : (
        // An anchor without href is not focusable on its own.
        <a role="link" aria-disabled="true" tabIndex={0} {...common}>
          {content}
        </a>
      );
    }
    if (getHref !== undefined) {
      return (
        <Anchor
          href={getHref(target)}
          onClick={(event) => {
            if (onPageChange === undefined) return;
            event.preventDefault();
            onPageChange(target);
          }}
          {...common}
        >
          {content}
        </Anchor>
      );
    }
    return (
      <button type="button" onClick={() => onPageChange?.(target)} {...common}>
        {content}
      </button>
    );
  };

  const previous = pageControl(
    current - 1,
    <>
      <CaretLeftIcon aria-hidden weight="bold" className="size-3.5 rtl:rotate-180" />
      <span className="max-sm:sr-only">{previousLabel}</span>
    </>,
    { label: previousLabel, disabled: current <= 1, className: 'pe-2.5' },
  );
  const next = pageControl(
    current + 1,
    <>
      <span className="max-sm:sr-only">{nextLabel}</span>
      <CaretRightIcon aria-hidden weight="bold" className="size-3.5 rtl:rotate-180" />
    </>,
    { label: nextLabel, disabled: current >= total, className: 'ps-2.5' },
  );

  const showFull = variant !== 'compact';
  const showCompact = variant !== 'full';

  return (
    <nav aria-label={label} data-slot="pagination" className={className} {...props}>
      {/* Touch hit areas reach past each control; the wider gap keeps them from overlapping, and a
          full row that no longer fits a narrow screen wraps instead of widening the page. */}
      <ul className="flex flex-wrap items-center gap-1 pointer-coarse:gap-4">
        <li>{previous}</li>
        {showFull &&
          paginationRange(current, total, siblings).map((item) =>
            typeof item === 'number' ? (
              <li key={item} className={cn(variant === 'responsive' && 'max-sm:hidden')}>
                {pageControl(item, item, {
                  label: formatPageLabel(item),
                  current: item === current,
                })}
              </li>
            ) : (
              <li
                key={item}
                aria-hidden
                className={cn(
                  'inline-flex w-6 justify-center text-sm text-fg-subtle',
                  variant === 'responsive' && 'max-sm:hidden',
                )}
              >
                …
              </li>
            ),
          )}
        {showCompact && (
          <li
            className={cn(
              'px-2 text-sm whitespace-nowrap text-fg-muted numeric',
              variant === 'responsive' && 'sm:hidden',
            )}
          >
            <span role="status">{formatStatus(current, total)}</span>
          </li>
        )}
        <li>{next}</li>
      </ul>
      {/* Paging keeps focus on the control: say where it landed. The visible compact status speaks for itself. */}
      {variant !== 'compact' && (
        <p role="status" className={cn('sr-only', variant === 'responsive' && 'max-sm:hidden')}>
          {formatStatus(current, total)}
        </p>
      )}
    </nav>
  );
}

import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { RowData } from '@tanstack/react-table';

import { Button } from '../button/button';
import { cn } from '../lib/cn';
import type { DataTableInstance } from './data-table';

export interface DataTablePaginationProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  /** BCP 47 locale for the row counts. */
  locale?: string;
  /** Text for the range, so the strip can be translated. */
  formatRange?: (first: number, last: number, total: number) => string;
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
}

/**
 * Previous and next for a table made with `useDataTable({ paginate: true })`. Shows which rows are
 * on screen out of how many; the range is a live region, so paging is read out.
 */
export function DataTablePagination<TData extends RowData>({
  table,
  locale,
  formatRange,
  previousLabel = 'Previous page',
  nextLabel = 'Next page',
  className,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.state.pagination;
  const total = table.getRowCount();
  const first = total === 0 ? 0 : pageIndex * pageSize + 1;
  const last = Math.min(total, (pageIndex + 1) * pageSize);
  const number = new Intl.NumberFormat(locale);
  const text =
    formatRange?.(first, last, total) ??
    `${number.format(first)} to ${number.format(last)} of ${number.format(total)}`;

  return (
    <nav
      aria-label="Pagination"
      data-slot="data-table-pagination"
      className={cn('flex items-center justify-end gap-3 pt-3', className)}
    >
      <p aria-live="polite" className="me-auto text-sm text-fg-muted numeric">
        {text}
      </p>
      {/* Wider apart on touch screens, so the two hit areas never overlap. */}
      <div className="flex gap-1 pointer-coarse:gap-4">
        <Button
          variant="secondary"
          size="sm"
          iconOnly
          // Stays focusable at the first or last page, so keyboard focus is not dropped.
          focusableWhenDisabled
          aria-label={previousLabel}
          disabled={!table.getCanPreviousPage()}
          onClick={() => {
            table.previousPage();
          }}
        >
          <CaretLeftIcon aria-hidden weight="bold" className="size-3.5 rtl:-scale-x-100" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          iconOnly
          focusableWhenDisabled
          aria-label={nextLabel}
          disabled={!table.getCanNextPage()}
          onClick={() => {
            table.nextPage();
          }}
        >
          <CaretRightIcon aria-hidden weight="bold" className="size-3.5 rtl:-scale-x-100" />
        </Button>
      </div>
    </nav>
  );
}

import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';

export type CellAlign = 'start' | 'center' | 'end';

const ALIGN: Record<CellAlign, string> = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
};

/**
 * Plain table parts with the rectio look: hairline rows, density-aware row height, a header that
 * can stick. DataTable builds on these; use them alone for static tables.
 *
 * `border-separate` with no spacing, not `border-collapse`: collapsed borders do not travel with a
 * sticky header, so its rule would vanish as rows scroll under it.
 */
export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <table
      data-slot="table"
      className={cn('w-full border-separate border-spacing-0 text-base text-fg', className)}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return (
    <caption
      className={cn('pb-3 text-start text-sm text-fg-muted caption-top', className)}
      {...props}
    />
  );
}

export interface TableHeaderProps extends ComponentProps<'thead'> {
  /** Keep the header row in view while the rows scroll, inside a scrolling DataTable or the page. */
  sticky?: boolean;
}

export function TableHeader({ className, sticky = false, ...props }: TableHeaderProps) {
  return (
    <thead
      data-sticky={sticky || undefined}
      className={cn(sticky && 'sticky top-0 z-10', className)}
      {...props}
    />
  );
}

export function TableBody(props: ComponentProps<'tbody'>) {
  return <tbody {...props} />;
}

export function TableFooter({ className, ...props }: ComponentProps<'tfoot'>) {
  return <tfoot data-slot="table-footer" className={className} {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'transition-colors duration-fast ease-standard',
        'data-selected:bg-(--rx-table-row-selected)',
        className,
      )}
      {...props}
    />
  );
}

export interface TableHeadProps extends Omit<ComponentProps<'th'>, 'align'> {
  align?: CellAlign | undefined;
}

/** A header cell. In the footer, use `scope="row"` for the label of a totals row. */
export function TableHead({ className, align = 'start', scope = 'col', ...props }: TableHeadProps) {
  return (
    <th
      scope={scope}
      className={cn(
        'h-(--rx-table-header-height) px-(--rx-table-cell-padding-x) align-middle',
        'text-sm font-medium whitespace-nowrap text-fg-muted',
        'border-b border-line-strong bg-(--rx-table-header-background)',
        // In the footer, the label of a totals row sits on the strong rule above it.
        'in-[tfoot]:border-t-2 in-[tfoot]:border-b-0 in-[tfoot]:bg-transparent',
        ALIGN[align],
        className,
      )}
      {...props}
    />
  );
}

export interface TableCellProps extends Omit<ComponentProps<'td'>, 'align'> {
  align?: CellAlign | undefined;
}

export function TableCell({ className, align = 'start', ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        'h-(--rx-table-row-height) px-(--rx-table-cell-padding-x) py-2 align-middle',
        'border-b border-line',
        // A totals row draws its own strong rule, so the last body row drops its hairline.
        'in-[table:has(tfoot)>tbody>tr:last-child]:border-b-0',
        'in-[tfoot]:border-t-2 in-[tfoot]:border-b-0 in-[tfoot]:border-line-strong',
        ALIGN[align],
        className,
      )}
      {...props}
    />
  );
}

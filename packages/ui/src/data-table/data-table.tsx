import { ArrowDownIcon, ArrowUpIcon, ArrowsDownUpIcon } from '@phosphor-icons/react';
import {
  createPaginatedRowModel,
  createSortedRowModel,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type Header,
  type ReactTable,
  type Row,
  type RowData,
  type TableOptions,
} from '@tanstack/react-table';
import { createContext, use, useState, type ComponentProps, type ReactNode } from 'react';

import { Checkbox } from '../checkbox/checkbox';
import { cn } from '../lib/cn';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  type CellAlign,
} from './table';

/** What a column can tell the table about itself, beyond TanStack's own options. */
export interface DataTableColumnMeta {
  /** `end` for amounts and quantities, so figures line up on the decimal side. */
  align?: CellAlign;
  /** Name read out when the column is sorted. Defaults to the header when it is a string. */
  label?: string;
  /** Classes for every cell of the column (header, body, footer), such as `hidden sm:table-cell`. */
  className?: string;
}

/** Sorting, row selection and pagination, plus the sort functions they need. Nothing else ships. */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

export type DataTableFeatures = typeof dataTableFeatures;
export type DataTableColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<
  DataTableFeatures,
  TData,
  TValue
>;
export type DataTableInstance<TData extends RowData> = ReactTable<DataTableFeatures, TData>;

export type UseDataTableOptions<TData extends RowData> = Omit<
  TableOptions<DataTableFeatures, TData>,
  'features'
> & {
  /** Page the rows client-side. Off by default: a report shows every line. */
  paginate?: boolean;
};

/**
 * TanStack Table with the DataTable features registered. Everything TanStack's `useTable` takes
 * still works: controlled `state` with `on*Change`, `initialState`, `getRowId`, `enableRowSelection`.
 */
export function useDataTable<TData extends RowData>({
  paginate = false,
  ...options
}: UseDataTableOptions<TData>): DataTableInstance<TData> {
  return useTable({
    features: dataTableFeatures,
    manualPagination: !paginate,
    // Sorting works on what the column shows; a third click returns to the original order.
    enableSortingRemoval: true,
    ...options,
  });
}

/** Lets the header announce a new sort through the table's live region. */
const AnnounceContext = createContext<(message: string) => void>(() => undefined);

export interface DataTableProps extends Omit<ComponentProps<'table'>, 'children'> {
  /** Names the table for screen readers, and visually unless `hideCaption`. */
  caption: ReactNode;
  hideCaption?: boolean;
  /**
   * Scroll inside a box of the height you give with `containerClassName` (for example `max-h-96`)
   * instead of with the page. The box becomes a focusable region so keyboard users can scroll it.
   */
  scrollable?: boolean;
  containerClassName?: string;
  children: ReactNode;
}

/**
 * The frame: caption, scroll box and a polite live region that reads out sort changes. Compose the
 * header, body and footer inside it; each takes the table instance from `useDataTable`.
 */
export function DataTable({
  caption,
  hideCaption = false,
  scrollable = false,
  containerClassName,
  className,
  children,
  ...props
}: DataTableProps) {
  const [announcement, setAnnouncement] = useState('');
  return (
    <AnnounceContext value={setAnnouncement}>
      <div
        data-slot="data-table"
        className={cn(
          'relative',
          scrollable && 'overflow-auto rounded-(--rx-badge-radius) outline-offset-2',
          scrollable && 'focus-visible:outline-2 focus-visible:outline-focus',
          containerClassName,
        )}
        {...(scrollable ? { role: 'region', 'aria-label': textOf(caption), tabIndex: 0 } : {})}
      >
        <Table className={className} {...props}>
          <TableCaption className={cn(hideCaption && 'sr-only')}>{caption}</TableCaption>
          {children}
        </Table>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </AnnounceContext>
  );
}

function textOf(node: ReactNode): string | undefined {
  return typeof node === 'string' ? node : undefined;
}

function metaOf<TData extends RowData>(column: { columnDef: DataTableColumnDef<TData> }) {
  return column.columnDef.meta ?? {};
}

function columnLabel<TData extends RowData>(header: Header<DataTableFeatures, TData>) {
  const meta = metaOf(header.column);
  const def = header.column.columnDef.header;
  return meta.label ?? (typeof def === 'string' ? def : header.column.id);
}

const SORT_WORDS = { asc: 'ascending', desc: 'descending' } as const;

export interface DataTableHeaderProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  /** Keep the header in view while rows scroll under it. */
  sticky?: boolean;
  className?: string;
}

/**
 * Header rows. A sortable column renders its title as a button; `aria-sort` on the cell says the
 * current order, and the live region says what changed.
 */
export function DataTableHeader<TData extends RowData>({
  table,
  sticky = false,
  className,
}: DataTableHeaderProps<TData>) {
  const announce = use(AnnounceContext);
  return (
    <TableHeader sticky={sticky} className={className}>
      {table.getHeaderGroups().map((group) => (
        <TableRow key={group.id}>
          {group.headers.map((header) => {
            const meta = metaOf(header.column);
            const sorted = header.column.getIsSorted();
            const canSort = header.column.getCanSort();
            return (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                align={meta.align}
                aria-sort={canSort ? (sorted === false ? 'none' : SORT_WORDS[sorted]) : undefined}
                className={cn(canSort && 'p-0', meta.className)}
              >
                {header.isPlaceholder ? null : canSort ? (
                  <SortButton
                    align={meta.align ?? 'start'}
                    sorted={sorted}
                    onClick={(event) => {
                      const next = header.column.getNextSortingOrder();
                      const label = columnLabel(header);
                      header.column.getToggleSortingHandler()?.(event);
                      announce(
                        next === false
                          ? `${label}, sort removed`
                          : `Sorted by ${label}, ${SORT_WORDS[next]}`,
                      );
                    }}
                  >
                    <table.FlexRender header={header} />
                  </SortButton>
                ) : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            );
          })}
        </TableRow>
      ))}
    </TableHeader>
  );
}

function SortButton({
  align,
  sorted,
  children,
  ...props
}: ComponentProps<'button'> & { align: CellAlign; sorted: false | 'asc' | 'desc' }) {
  const Icon =
    sorted === 'asc' ? ArrowUpIcon : sorted === 'desc' ? ArrowDownIcon : ArrowsDownUpIcon;
  return (
    <button
      type="button"
      data-sorted={sorted || undefined}
      className={cn(
        'group/sort inline-flex h-full w-full cursor-pointer items-center gap-1.5 px-(--rx-table-cell-padding-x)',
        'font-medium whitespace-nowrap text-fg-muted hover:text-fg data-sorted:text-fg',
        'transition-colors duration-fast ease-standard',
        '-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        // Amounts sort with the arrow before the title, so the title keeps the column's right edge.
        align === 'end' && 'flex-row-reverse',
        align === 'center' && 'justify-center',
      )}
      {...props}
    >
      <span>{children}</span>
      <Icon
        aria-hidden
        weight="bold"
        className={cn(
          'size-3 shrink-0',
          // Unsorted columns show a quiet cue, so it is clear which headers sort.
          sorted === false && 'text-fg-disabled group-hover/sort:text-fg-subtle',
        )}
      />
    </button>
  );
}

export interface DataTableBodyProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  /** Shown in place of rows when there are none. Say why, and what to do next. */
  empty?: ReactNode;
  /** Skeleton rows in the shape of the table while data loads. */
  loading?: boolean;
  loadingRows?: number;
  /** Extra props per row, such as `data-new` to highlight a row just added. */
  rowProps?: (
    row: Row<DataTableFeatures, TData>,
  ) => ComponentProps<'tr'> & Record<`data-${string}`, unknown>;
}

export function DataTableBody<TData extends RowData>({
  table,
  empty,
  loading = false,
  loadingRows = 5,
  rowProps,
}: DataTableBodyProps<TData>) {
  const columns = table.getAllLeafColumns();
  const rows = table.getRowModel().rows;

  if (loading) {
    return (
      <TableBody aria-busy="true" data-loading="">
        {Array.from({ length: loadingRows }, (_, index) => (
          <TableRow key={index}>
            {columns.map((column, columnIndex) => {
              const meta = metaOf(column);
              return (
                <TableCell key={column.id} align={meta.align} className={meta.className}>
                  <span
                    aria-hidden
                    className={cn(
                      // The border colour stays visible on the canvas in light and dark alike.
                      'inline-block h-3 rounded-(--rx-badge-radius) bg-line align-middle',
                      // Widths relative to the column, so skeletons never widen the table. Varied
                      // widths read as text; a uniform bar reads as a progress meter.
                      column.id === 'select'
                        ? 'size-4'
                        : ['w-3/5', 'w-4/5', 'w-1/2', 'w-2/3'][(index + columnIndex) % 4],
                    )}
                  />
                </TableCell>
              );
            })}
          </TableRow>
        ))}
        <tr className="sr-only">
          <td>Loading rows</td>
        </tr>
      </TableBody>
    );
  }

  if (rows.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={columns.length} className="h-auto py-10 text-center text-fg-muted">
            {empty ?? 'No rows.'}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {rows.map((row) => (
        <TableRow
          key={row.id}
          data-selected={row.getIsSelected() || undefined}
          {...rowProps?.(row)}
        >
          {row.getAllCells().map((cell) => {
            const meta = metaOf(cell.column);
            return (
              <TableCell key={cell.id} align={meta.align} className={meta.className}>
                <table.FlexRender cell={cell} />
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </TableBody>
  );
}

/**
 * Totals and other summary rows, from each column's `footer`. A column without one leaves an
 * empty cell, so the figures stay under their own headers.
 */
export function DataTableFooter<TData extends RowData>({
  table,
  className,
}: {
  table: DataTableInstance<TData>;
  className?: string;
}) {
  const groups = table.getFooterGroups();
  const last = groups.at(-1);
  if (last === undefined) return null;
  return (
    <TableFooter className={className}>
      <TableRow>
        {last.headers.map((header) => {
          const meta = metaOf(header.column);
          return (
            <TableCell key={header.id} align={meta.align} className={meta.className}>
              {header.isPlaceholder ? null : <table.FlexRender footer={header} />}
            </TableCell>
          );
        })}
      </TableRow>
    </TableFooter>
  );
}

export interface SelectionColumnOptions<TData extends RowData> {
  /** Names a row's checkbox, such as "Select Lufthansa, 3 Mar". */
  rowLabel: (row: Row<DataTableFeatures, TData>) => string;
  /** Names the header checkbox. */
  allLabel?: string;
}

/**
 * A leading checkbox column. Shift-click selects a range in display order; the header box selects
 * every row and shows a bar when only some are selected.
 */
export function selectionColumn<TData extends RowData>({
  rowLabel,
  allLabel = 'Select all rows',
}: SelectionColumnOptions<TData>): DataTableColumnDef<TData> {
  return {
    id: 'select',
    enableSorting: false,
    meta: { className: 'w-0 pe-0' },
    header: ({ table }) => {
      // Counted from the rows on hand, so a selection kept for rows that are not loaded (or an
      // empty table) never shows a stale bar.
      const rows = table.getCoreRowModel().rows;
      const selected = rows.filter((row) => row.getIsSelected()).length;
      const all = rows.length > 0 && selected === rows.length;
      return (
        <span className="flex items-center">
          <Checkbox
            aria-label={allLabel}
            checked={all}
            indeterminate={selected > 0 && !all}
            disabled={rows.length === 0}
            onCheckedChange={(checked) => {
              table.toggleAllRowsSelected(checked);
            }}
          />
        </span>
      );
    },
    cell: ({ row }) => (
      <span className="flex items-center">
        <Checkbox
          aria-label={rowLabel(row)}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(_checked, details) => {
            row.getToggleSelectedHandler()(details.event);
          }}
        />
      </span>
    ),
  };
}

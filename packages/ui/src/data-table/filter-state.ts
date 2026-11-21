import type { FilterFn, RowData } from '@tanstack/react-table';

import type { DataTableInstance } from './data-table';

/** True for a filter value that filters nothing: empty text or an empty choice. */
function isEmptyFilter(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  );
}

/** Lower case without accents, so "Zurich" finds "Zürich". */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

/**
 * The one filter every column and the search box use unless a column picks another: a list keeps
 * the rows whose value is one of its items (a facet filter's choices), text keeps the rows whose
 * value contains it, ignoring case and accents (the search box), anything else must be equal.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- registered once for every table's row type
export const filterFn_match: FilterFn<any, any> = (row, columnId, filterValue: unknown) => {
  const value: unknown = row.getValue(columnId);
  if (Array.isArray(filterValue)) return filterValue.includes(value);
  if (typeof filterValue === 'string') {
    // Text and numbers are searched as they read; dates and objects need a filter of their own.
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    return fold(String(value)).includes(fold(filterValue.trim()));
  }
  return Object.is(value, filterValue);
};
filterFn_match.autoRemove = isEmptyFilter;

/** True while the search box or any column filter narrows the rows. */
export function isDataTableFiltered<TData extends RowData>(table: DataTableInstance<TData>) {
  const search: unknown = table.state.globalFilter;
  return (
    (typeof search === 'string' && search.trim() !== '') || table.state.columnFilters.length > 0
  );
}

/** Empties the search box and every column filter. */
export function clearDataTableFilters<TData extends RowData>(table: DataTableInstance<TData>) {
  table.resetColumnFilters(true);
  table.resetGlobalFilter(true);
}

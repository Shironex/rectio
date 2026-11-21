'use client';

import { CaretDownIcon, XIcon } from '@phosphor-icons/react';
import type { RowData } from '@tanstack/react-table';
import type { ReactNode } from 'react';

import { Button } from '../button/button';
import { cn } from '../lib/cn';
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from '../menu/menu';
import { SearchInput, type SearchInputProps } from '../search-input/search-input';
import type { DataTableInstance } from './data-table';
import { clearDataTableFilters, isDataTableFiltered } from './filter-state';

export interface DataTableSearchProps<TData extends RowData> extends Omit<
  SearchInputProps,
  'value' | 'defaultValue' | 'onValueChange'
> {
  table: DataTableInstance<TData>;
  /** Names the field, and is its placeholder unless you pass one. */
  label?: string;
}

/**
 * A search box over every column that holds text or numbers. It writes the table's global filter,
 * so it is controlled or not like the rest of the table state (`state.globalFilter` with
 * `onGlobalFilterChange`, or `initialState`). A column opts out with `enableGlobalFilter: false`.
 */
export function DataTableSearch<TData extends RowData>({
  table,
  label = 'Search rows',
  placeholder,
  groupClassName,
  ...props
}: DataTableSearchProps<TData>) {
  const search: unknown = table.state.globalFilter;
  return (
    <SearchInput
      aria-label={label}
      placeholder={placeholder ?? label}
      value={typeof search === 'string' ? search : ''}
      onValueChange={(value) => {
        table.setGlobalFilter(value);
      }}
      groupClassName={cn('w-full @md/toolbar:w-64', groupClassName)}
      {...props}
    />
  );
}

export interface DataTableFacetOption {
  value: unknown;
  label: ReactNode;
}

export interface DataTableFacetFilterProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  /** The id of the column to filter. */
  column: string;
  /** The trigger's words, such as "Status". */
  label: string;
  /**
   * The choices, in your order and words. Left out, they are the column's distinct values as
   * text, in the order they first appear.
   */
  options?: readonly DataTableFacetOption[];
  /** BCP 47 locale for the counts. */
  locale?: string;
  /** The menu item that empties this filter. Default "Clear" and the label, such as "Clear status". */
  clearLabel?: string;
  className?: string;
}

/**
 * A menu of a column's values to keep, each with how many rows have it given the other filters.
 * Several can be picked; the trigger says how many are on. Arrow keys move, Space or Enter
 * toggles, and the menu stays open so several can be picked in a row.
 */
export function DataTableFacetFilter<TData extends RowData>({
  table,
  column: columnId,
  label,
  options,
  locale,
  clearLabel,
  className,
}: DataTableFacetFilterProps<TData>) {
  const column = table.getColumn(columnId);
  if (column === undefined) return null;
  const counts = column.getFacetedUniqueValues();
  const choices: readonly DataTableFacetOption[] =
    options ??
    [...(counts.keys() as Iterable<unknown>)].map((value) => ({
      value,
      label: typeof value === 'string' || typeof value === 'number' ? String(value) : '',
    }));
  const raw: unknown = column.getFilterValue();
  const selected = Array.isArray(raw) ? (raw as unknown[]) : [];
  const number = new Intl.NumberFormat(locale);
  const toggle = (value: unknown, on: boolean) => {
    const next = on ? [...selected, value] : selected.filter((item) => item !== value);
    column.setFilterValue(next.length === 0 ? undefined : next);
  };
  return (
    <Menu>
      <MenuTrigger
        render={
          // Medium, so the trigger stands level with the search box beside it.
          <Button
            variant="secondary"
            data-active={selected.length > 0 || undefined}
            aria-label={
              selected.length > 0
                ? `${label}, ${number.format(selected.length)} selected`
                : undefined
            }
            className={cn('data-active:border-accent', className)}
          />
        }
      >
        {label}
        {selected.length > 0 && (
          <span className="numeric rounded-badge bg-accent-subtle px-1.5 text-xs font-medium text-accent-strong">
            {number.format(selected.length)}
          </span>
        )}
        <CaretDownIcon aria-hidden weight="bold" className="size-3.5 text-fg-muted" />
      </MenuTrigger>
      <MenuContent align="start" className="min-w-52">
        {choices.map((choice, index) => (
          <MenuCheckboxItem
            key={index}
            checked={selected.includes(choice.value)}
            onCheckedChange={(checked) => {
              toggle(choice.value, checked);
            }}
          >
            <span className="flex flex-1 items-center justify-between gap-4">
              <span>{choice.label}</span>
              <span className="numeric text-xs text-fg-muted">
                {number.format(counts.get(choice.value) ?? 0)}
              </span>
            </span>
          </MenuCheckboxItem>
        ))}
        {selected.length > 0 && (
          <>
            <MenuSeparator />
            <MenuItem
              // In the check column, so its words line up with the values above.
              icon={<XIcon weight="bold" className="size-3.5" />}
              onClick={() => {
                column.setFilterValue(undefined);
              }}
            >
              {clearLabel ?? `Clear ${label.toLocaleLowerCase(locale)}`}
            </MenuItem>
          </>
        )}
      </MenuContent>
    </Menu>
  );
}

export interface DataTableToolbarProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  /** The search box and facet filters. */
  children: ReactNode;
  /** BCP 47 locale for the row count. */
  locale?: string;
  /** The count shown while filtered, so it can be translated. */
  formatCount?: (shown: number, total: number) => string;
  clearLabel?: string;
  /** Names the group of filters for assistive technology. */
  label?: string;
  className?: string;
}

/**
 * The row above a table that holds its search and filters. While anything narrows the rows it
 * says how many are shown out of how many (read out politely as it changes) and offers to clear
 * every filter at once.
 */
export function DataTableToolbar<TData extends RowData>({
  table,
  children,
  locale,
  formatCount,
  clearLabel = 'Clear filters',
  label = 'Table filters',
  className,
}: DataTableToolbarProps<TData>) {
  const filtered = isDataTableFiltered(table);
  // With no row left, the table body offers the same button where the eye already is.
  const shown = table.getFilteredRowModel().rows.length;
  const total = table.getCoreRowModel().rows.length;
  const number = new Intl.NumberFormat(locale);
  const count =
    formatCount?.(shown, total) ??
    `${number.format(shown)} of ${number.format(total)} ${total === 1 ? 'row' : 'rows'}`;
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="data-table-toolbar"
      className={cn('@container/toolbar flex flex-wrap items-center gap-2', className)}
    >
      {children}
      <div className="ms-auto flex items-center gap-1">
        <span role="status" aria-live="polite" className="numeric text-sm text-fg-muted">
          {filtered ? count : ''}
        </span>
        {filtered && shown > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              clearDataTableFilters(table);
            }}
          >
            <XIcon aria-hidden weight="bold" className="size-3.5" />
            {/* In a narrow toolbar the cross alone, so the count and filters keep one row. */}
            <span className="@max-sm/toolbar:sr-only">{clearLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

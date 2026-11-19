import { ArrowDownIcon, ArrowUpIcon, ArrowsDownUpIcon } from '@phosphor-icons/react';
import type { RowData } from '@tanstack/react-table';

import { Button } from '../button/button';
import { Field, FieldLabel } from '../field/field';
import { cn } from '../lib/cn';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../select/select';
import type { DataTableInstance } from './data-table';

export interface DataTableSortProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  /** Visible label of the column list. */
  label?: string;
  /** Shown while no column sorts the rows, and the first option, which clears the sort. */
  placeholder?: string;
  /** Name of the order button; it is pressed while the order is descending. */
  descendingLabel?: string;
  className?: string;
}

/**
 * "Sort by" for screens where the header cannot carry every sortable column, such as phones that
 * fold columns under the first one. Lists every sortable column by its `meta.label` or string
 * header, and a pressed button reverses the order. It drives the same sorting state as the header,
 * so both always agree. Show it only where it is needed, for example with `className="sm:hidden"`.
 *
 * Give a sortable column with a non-string header a `meta.label`, or the list falls back to its id.
 * The label, placeholder and order name are props, for translation.
 */
export function DataTableSort<TData extends RowData>({
  table,
  label = 'Sort by',
  placeholder = 'Original order',
  descendingLabel = 'Descending',
  className,
}: DataTableSortProps<TData>) {
  const columns = table.getAllLeafColumns().filter((column) => column.getCanSort());
  const items = columns.map((column) => {
    const header = column.columnDef.header;
    return {
      value: column.id,
      label: column.columnDef.meta?.label ?? (typeof header === 'string' ? header : column.id),
    };
  });
  const current = table.state.sorting[0];

  return (
    <div data-slot="data-table-sort" className={cn('flex items-end gap-1.5', className)}>
      <Field className="min-w-0 flex-1">
        <FieldLabel>{label}</FieldLabel>
        <Select
          items={[{ value: null, label: placeholder }, ...items]}
          value={current?.id ?? null}
          onValueChange={(value) => {
            const column = columns.find((c) => c.id === value);
            if (column === undefined) {
              table.setSorting([]);
              return;
            }
            // A new column starts in its natural order: amounts high to low, text A to Z.
            table.setSorting([{ id: column.id, desc: column.getFirstSortDir() === 'desc' }]);
          }}
        >
          <SelectTrigger placeholder={placeholder} />
          <SelectContent>
            {/* The way back on a phone, where the header cannot cycle the order off. */}
            <SelectItem value={null}>{placeholder}</SelectItem>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Button
        variant="secondary"
        iconOnly
        aria-label={descendingLabel}
        aria-pressed={current?.desc ?? false}
        // Stays focusable with nothing sorted, so the pair keeps its place in the tab order.
        focusableWhenDisabled
        disabled={current === undefined}
        onClick={() => {
          if (current !== undefined) table.setSorting([{ id: current.id, desc: !current.desc }]);
        }}
      >
        {/* The neutral arrows of the header while nothing sorts: no direction to show yet. */}
        {current === undefined ? (
          <ArrowsDownUpIcon aria-hidden weight="bold" className="size-4" />
        ) : current.desc ? (
          <ArrowDownIcon aria-hidden weight="bold" className="size-4" />
        ) : (
          <ArrowUpIcon aria-hidden weight="bold" className="size-4" />
        )}
      </Button>
    </div>
  );
}

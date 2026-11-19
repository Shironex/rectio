'use client';

import { MinusIcon, PlusIcon } from '@phosphor-icons/react';
import { Button, DataTableBody, Money } from '@rectio/motion';
import {
  DataTable,
  DataTableFooter,
  DataTableHeader,
  useDataTable,
  type DataTableColumnDef,
} from '@rectio/ui';
import { useState } from 'react';

import { EXPENSES, TRAIN, columns as plainColumns, total, type Expense } from './data-table';

/** The plain columns, with a total that counts to its new figure. */
const columns: DataTableColumnDef<Expense>[] = plainColumns.map((column) =>
  column.id === 'amount'
    ? {
        ...column,
        footer: ({ table }) => (
          <Money
            amount={total(table.getRowModel().rows)}
            currency="EUR"
            locale="en-IE"
            className="text-lg font-strong"
          />
        ),
      }
    : column,
);

export default function DataTableMotionDemo() {
  const [expenses, setExpenses] = useState(EXPENSES);
  const hasTrain = expenses.includes(TRAIN);
  const table = useDataTable({
    data: expenses,
    columns,
    getRowId: (expense) => expense.id,
    initialState: { sorting: [{ id: 'date', desc: false }] },
  });
  const selected = table.getSelectedRowModel().rows;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex min-h-(--rx-control-height-sm) flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setExpenses((list) => (hasTrain ? list.filter((e) => e !== TRAIN) : [...list, TRAIN]));
          }}
        >
          {hasTrain ? (
            <MinusIcon aria-hidden weight="bold" className="size-3.5" />
          ) : (
            <PlusIcon aria-hidden weight="bold" className="size-3.5" />
          )}
          {hasTrain ? 'Remove Deutsche Bahn' : 'Add Deutsche Bahn'}
        </Button>
        {selected.length > 0 && (
          <p className="text-sm text-fg-muted">
            {selected.length} selected,{' '}
            <Money amount={total(selected)} currency="EUR" locale="en-IE" />
          </p>
        )}
      </div>
      <DataTable caption="Expenses in report 2041" hideCaption>
        <DataTableHeader table={table} />
        <DataTableBody table={table} />
        <DataTableFooter table={table} />
      </DataTable>
    </div>
  );
}

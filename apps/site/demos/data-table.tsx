'use client';

import { MinusIcon, PlusIcon } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  DataTable,
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
  Money,
  selectionColumn,
  useDataTable,
  type BadgeTone,
  type DataTableColumnDef,
} from '@rectio/ui';
import { useState } from 'react';

export interface Expense {
  id: string;
  date: Date;
  merchant: string;
  status: 'Draft' | 'In review' | 'Approved';
  amount: number;
}

const TONES: Record<Expense['status'], BadgeTone> = {
  Draft: 'neutral',
  'In review': 'info',
  Approved: 'positive',
};

export const EXPENSES: Expense[] = [
  {
    id: 'e1',
    date: new Date(2026, 2, 3),
    merchant: 'Lufthansa',
    status: 'Approved',
    amount: 412.8,
  },
  {
    id: 'e2',
    date: new Date(2026, 2, 4),
    merchant: 'Hotel Bristol',
    status: 'Approved',
    amount: 538,
  },
  { id: 'e3', date: new Date(2026, 2, 5), merchant: 'Figma', status: 'In review', amount: 75 },
  {
    id: 'e4',
    date: new Date(2026, 2, 11),
    merchant: 'Atelier Restaurant',
    status: 'In review',
    amount: 214.5,
  },
  {
    id: 'e5',
    date: new Date(2026, 2, 18),
    merchant: 'Hotel Bristol',
    status: 'Approved',
    amount: -61,
  },
];

/** The line the button adds and removes. */
export const TRAIN: Expense = {
  id: 'e6',
  date: new Date(2026, 2, 19),
  merchant: 'Deutsche Bahn',
  status: 'Draft',
  amount: 89.9,
};

const shortDate = new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short' });

export const total = (rows: { original: Expense }[]) =>
  rows.reduce((sum, row) => sum + row.original.amount, 0);

export const columns: DataTableColumnDef<Expense>[] = [
  selectionColumn<Expense>({
    rowLabel: (row) => `Select ${row.original.merchant}, ${shortDate.format(row.original.date)}`,
    allLabel: 'Select all expenses',
  }),
  {
    accessorKey: 'date',
    header: 'Date',
    sortFn: 'datetime',
    meta: { className: 'hidden sm:table-cell' },
    cell: ({ row }) => (
      <span className="text-fg-muted numeric">{shortDate.format(row.original.date)}</span>
    ),
  },
  {
    accessorKey: 'merchant',
    header: 'Merchant',
    sortFn: 'text',
    footer: ({ table }) => (
      <span className="font-medium">Total, {table.getRowModel().rows.length} expenses</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    sortFn: 'text',
    cell: ({ row }) => <Badge tone={TONES[row.original.status]}>{row.original.status}</Badge>,
  },
  {
    id: 'amount',
    accessorKey: 'amount',
    header: 'Amount, EUR',
    meta: { align: 'end', label: 'Amount' },
    cell: ({ row }) => (
      <Money
        amount={row.original.amount}
        currency="EUR"
        locale="en-IE"
        tone={row.original.amount < 0 ? 'auto' : 'neutral'}
      />
    ),
    footer: ({ table }) => (
      <Money
        amount={total(table.getRowModel().rows)}
        currency="EUR"
        locale="en-IE"
        className="text-lg font-strong"
      />
    ),
  },
];

export default function DataTableDemo() {
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

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  DataTable,
  DataTableBody,
  DataTableHeader,
  useDataTable,
  type DataTableColumnDef,
} from './data-table';
import { DataTableFacetFilter, DataTableSearch, DataTableToolbar } from './filters';

interface Invoice {
  id: string;
  customer: string;
  status: 'paid' | 'due' | 'overdue';
  amount: number;
}

const INVOICES: Invoice[] = [
  { id: '1', customer: 'Zürich Insurance', status: 'paid', amount: 1200 },
  { id: '2', customer: 'Lufthansa', status: 'due', amount: 410 },
  { id: '3', customer: 'Figma', status: 'overdue', amount: 75 },
  { id: '4', customer: 'Hotel Bristol', status: 'due', amount: 538 },
];

const STATUS = { paid: 'Paid', due: 'Due', overdue: 'Overdue' };

const columns: DataTableColumnDef<Invoice>[] = [
  { accessorKey: 'customer', header: 'Customer' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => STATUS[row.original.status] },
  { accessorKey: 'amount', header: 'Amount', meta: { align: 'end' }, enableGlobalFilter: false },
];

function Invoices({ onSearch }: { onSearch?: (value: string) => void }) {
  const [globalFilter, setGlobalFilter] = useState('');
  const table = useDataTable({
    data: INVOICES,
    columns,
    getRowId: (invoice) => invoice.id,
    ...(onSearch === undefined
      ? {}
      : {
          state: { globalFilter },
          onGlobalFilterChange: (updater: string | ((old: string) => string)) => {
            const next = typeof updater === 'function' ? updater(globalFilter) : updater;
            setGlobalFilter(next);
            onSearch(next);
          },
        }),
  });
  return (
    <>
      <DataTableToolbar table={table} locale="en-GB">
        <DataTableSearch table={table} label="Search invoices" />
        <DataTableFacetFilter
          table={table}
          column="status"
          label="Status"
          options={(['paid', 'due', 'overdue'] as const).map((value) => ({
            value,
            label: STATUS[value],
          }))}
        />
      </DataTableToolbar>
      <DataTable caption="Invoices">
        <DataTableHeader table={table} />
        <DataTableBody table={table} />
      </DataTable>
    </>
  );
}

const toolbar = () => within(screen.getByRole('group', { name: 'Table filters' }));
/** The table body: the second row group, after the header. */
function tableBody(): HTMLElement {
  const [, body] = screen.getAllByRole('rowgroup');
  if (body === undefined) throw new Error('The table has no body');
  return body;
}
const bodyRows = () => within(tableBody()).getAllByRole('row');

describe('DataTable filters', () => {
  it('searches text columns ignoring case and accents, and says how many rows are shown', async () => {
    const user = userEvent.setup();
    render(<Invoices />);
    expect(screen.getByRole('group', { name: 'Table filters' })).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Search invoices' }), 'zurich');
    expect(bodyRows()).toHaveLength(1);
    expect(bodyRows()[0]).toHaveTextContent('Zürich Insurance');
    expect(toolbar().getByRole('status')).toHaveTextContent('1 of 4 rows');
  });

  it('does not search a column that opts out', async () => {
    const user = userEvent.setup();
    render(<Invoices />);
    await user.type(screen.getByRole('searchbox', { name: 'Search invoices' }), '410');
    expect(screen.getByText('No rows match')).toBeInTheDocument();
  });

  it('keeps the rows with any of the picked values, with counts, from the keyboard', async () => {
    const user = userEvent.setup();
    render(<Invoices />);
    const trigger = toolbar().getByRole('button', { name: 'Status' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await screen.findByRole('menu');
    // Paid, then Due: Space toggles and the menu stays open for the next pick.
    await user.keyboard('{ArrowDown}{ }{ArrowDown}{ }');
    expect(screen.getByRole('menuitemcheckbox', { name: /^Due/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await user.keyboard('{Escape}');
    expect(bodyRows()).toHaveLength(3);
    expect(toolbar().getByRole('button', { name: 'Status, 2 selected' })).toBeInTheDocument();
  });

  it('clears every filter from the empty filtered state and from the toolbar', async () => {
    const user = userEvent.setup();
    render(<Invoices />);
    const search = screen.getByRole('searchbox', { name: 'Search invoices' });
    await user.type(search, 'nobody');
    await user.click(within(tableBody()).getByRole('button', { name: 'Clear filters' }));
    expect(bodyRows()).toHaveLength(4);
    expect(search).toHaveValue('');
    await user.type(search, 'fig');
    await user.click(toolbar().getByRole('button', { name: 'Clear filters' }));
    expect(bodyRows()).toHaveLength(4);
    expect(toolbar().getByRole('status')).toHaveTextContent('');
  });

  it('works with the search held in your own state', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<Invoices onSearch={onSearch} />);
    await user.type(screen.getByRole('searchbox', { name: 'Search invoices' }), 'lu');
    expect(onSearch).toHaveBeenLastCalledWith('lu');
    expect(bodyRows()).toHaveLength(1);
  });
});

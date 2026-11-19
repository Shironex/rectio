import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Money } from '../money/money';
import {
  DataTable,
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
  selectionColumn,
  useDataTable,
  type DataTableColumnDef,
} from './data-table';
import { DataTablePagination } from './pagination';
import { DataTableSort } from './sort';

interface Line {
  id: string;
  merchant: string;
  amount: number;
}

const LINES: Line[] = [
  { id: 'a', merchant: 'Lufthansa', amount: 412.8 },
  { id: 'b', merchant: 'Figma', amount: 75 },
  { id: 'c', merchant: 'Hotel Bristol', amount: 538 },
];

const columns: DataTableColumnDef<Line>[] = [
  selectionColumn<Line>({ rowLabel: (row) => `Select ${row.original.merchant}` }),
  { accessorKey: 'merchant', header: 'Merchant', footer: 'Total' },
  {
    accessorKey: 'amount',
    header: 'Amount',
    meta: { align: 'end' },
    cell: ({ row }) => <Money amount={row.original.amount} currency="EUR" locale="en-IE" />,
    footer: ({ table }) => (
      <Money
        amount={table.getRowModel().rows.reduce((sum, row) => sum + row.original.amount, 0)}
        currency="EUR"
        locale="en-IE"
      />
    ),
  },
];

function Lines({
  data = LINES,
  loading = false,
  paginate = false,
  sortControl = false,
}: {
  data?: Line[];
  loading?: boolean;
  paginate?: boolean;
  sortControl?: boolean;
}) {
  const table = useDataTable({
    data,
    columns,
    getRowId: (line) => line.id,
    paginate,
    ...(paginate ? { initialState: { pagination: { pageIndex: 0, pageSize: 2 } } } : {}),
  });
  return (
    <>
      {sortControl && <DataTableSort table={table} />}
      <DataTable caption="Expenses">
        <DataTableHeader table={table} sticky />
        <DataTableBody table={table} loading={loading} empty="No expenses yet." />
        <DataTableFooter table={table} />
      </DataTable>
      {paginate && <DataTablePagination table={table} />}
    </>
  );
}

const bodyRows = () => {
  const [, body] = screen.getAllByRole('rowgroup');
  if (body === undefined) throw new Error('no body');
  return within(body).getAllByRole('row');
};
const merchants = () => bodyRows().map((row) => within(row).getAllByRole('cell')[1]?.textContent);

describe('DataTable', () => {
  it('is a captioned table with column headers', () => {
    render(<Lines />);
    const table = screen.getByRole('table', { name: 'Expenses' });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3);
  });

  it('sorts by a column, says so with aria-sort, and announces the change', async () => {
    render(<Lines />);
    const amount = screen.getByRole('columnheader', { name: /Amount/ });
    expect(amount).toHaveAttribute('aria-sort', 'none');

    // Numbers sort high to low first, the way a finance user scans for the largest line.
    await userEvent.click(within(amount).getByRole('button'));
    expect(amount).toHaveAttribute('aria-sort', 'descending');
    expect(merchants()).toEqual(['Hotel Bristol', 'Lufthansa', 'Figma']);
    expect(screen.getByRole('status')).toHaveTextContent('Sorted by Amount, descending');

    await userEvent.click(within(amount).getByRole('button'));
    expect(amount).toHaveAttribute('aria-sort', 'ascending');
    expect(merchants()).toEqual(['Figma', 'Lufthansa', 'Hotel Bristol']);

    // A third press returns to the original order.
    await userEvent.click(within(amount).getByRole('button'));
    expect(amount).toHaveAttribute('aria-sort', 'none');
    expect(merchants()).toEqual(['Lufthansa', 'Figma', 'Hotel Bristol']);
    expect(screen.getByRole('status')).toHaveTextContent('Amount, sort removed');
  });

  it('sorts every sortable column from the Sort by control, in step with the header', async () => {
    render(<Lines sortControl />);
    const sortBy = screen.getByRole('combobox', { name: 'Sort by' });
    const order = screen.getByRole('button', { name: 'Descending' });
    expect(sortBy).toHaveTextContent('Original order');
    expect(order).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(sortBy);
    // The selection column never sorts, so it is not offered.
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Original order',
      'Merchant',
      'Amount',
    ]);
    await userEvent.click(screen.getByRole('option', { name: 'Amount' }));
    await waitFor(() => {
      expect(sortBy).toHaveTextContent('Amount');
    });
    // Same natural first order as the header: amounts high to low.
    expect(merchants()).toEqual(['Hotel Bristol', 'Lufthansa', 'Figma']);
    expect(order).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('columnheader', { name: /Amount/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );

    await userEvent.click(order);
    expect(order).toHaveAttribute('aria-pressed', 'false');
    expect(merchants()).toEqual(['Figma', 'Lufthansa', 'Hotel Bristol']);

    // The first option clears the sort again, the way back where the header cannot cycle it off.
    await userEvent.click(sortBy);
    await userEvent.click(await screen.findByRole('option', { name: 'Original order' }));
    await waitFor(() => {
      expect(sortBy).toHaveTextContent('Original order');
    });
    expect(order).toHaveAttribute('aria-disabled', 'true');
    expect(merchants()).toEqual(['Lufthansa', 'Figma', 'Hotel Bristol']);
  });

  it('sorts text columns from the keyboard', async () => {
    render(<Lines />);
    const merchant = screen.getByRole('button', { name: /Merchant/ });
    merchant.focus();
    await userEvent.keyboard('{Enter}');
    expect(merchants()).toEqual(['Figma', 'Hotel Bristol', 'Lufthansa']);
  });

  it('selects rows, marks them, and drives the select-all box', async () => {
    render(<Lines />);
    const all = screen.getByRole('checkbox', { name: 'Select all rows' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Figma' }));
    expect(screen.getByRole('checkbox', { name: 'Select Figma' })).toBeChecked();
    expect(bodyRows()[1]).toHaveAttribute('data-selected');
    expect(all).toHaveAttribute('aria-checked', 'mixed');

    await userEvent.click(all);
    expect(all).toBeChecked();
    for (const line of LINES)
      expect(screen.getByRole('checkbox', { name: `Select ${line.merchant}` })).toBeChecked();

    await userEvent.click(all);
    expect(all).not.toBeChecked();
    expect(bodyRows()[1]).not.toHaveAttribute('data-selected');
  });

  it('selects a range with Shift', async () => {
    render(<Lines />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('checkbox', { name: 'Select Lufthansa' }));
    await user.keyboard('{Shift>}');
    await user.click(screen.getByRole('checkbox', { name: 'Select Hotel Bristol' }));
    await user.keyboard('{/Shift}');
    expect(screen.getByRole('checkbox', { name: 'Select Figma' })).toBeChecked();
  });

  it('right-aligns amount columns and totals them in the footer', () => {
    render(<Lines />);
    expect(screen.getByRole('columnheader', { name: /Amount/ })).toHaveClass('text-end');
    const [, , footer] = screen.getAllByRole('rowgroup');
    if (footer === undefined) throw new Error('no footer');
    expect(within(footer).getByText('Total')).toBeInTheDocument();
    expect(within(footer).getByText('€1,025.80')).toBeInTheDocument();
  });

  it('shows the empty message when there are no rows', () => {
    render(<Lines data={[]} />);
    expect(screen.getByText('No expenses yet.')).toBeInTheDocument();
  });

  it('marks the body busy while loading', () => {
    render(<Lines loading />);
    const [, body] = screen.getAllByRole('rowgroup');
    expect(body).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Lufthansa')).not.toBeInTheDocument();
  });

  it('pages through rows when pagination is on', async () => {
    render(<Lines paginate />);
    expect(screen.getByText('1 to 2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('3 to 3 of 3')).toBeInTheDocument();
    expect(merchants()).toEqual(['Hotel Bristol']);
  });
});

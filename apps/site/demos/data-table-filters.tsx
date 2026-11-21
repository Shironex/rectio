'use client';

import {
  DataTable,
  DataTableBody,
  DataTableFacetFilter,
  DataTableHeader,
  DataTableSearch,
  DataTableToolbar,
  useDataTable,
} from '@rectio/ui';

import { EXPENSES, columns } from './data-table';

export default function DataTableFiltersDemo() {
  const table = useDataTable({
    data: EXPENSES,
    columns,
    getRowId: (expense) => expense.id,
    initialState: { sorting: [{ id: 'date', desc: false }] },
  });
  return (
    <div className="flex w-full flex-col gap-3">
      <DataTableToolbar table={table} locale="en-IE">
        <DataTableSearch table={table} label="Search expenses" />
        <DataTableFacetFilter
          table={table}
          column="status"
          label="Status"
          locale="en-IE"
          options={['Draft', 'In review', 'Approved'].map((value) => ({ value, label: value }))}
        />
      </DataTableToolbar>
      <DataTable caption="Expenses, March 2026" hideCaption>
        <DataTableHeader table={table} />
        <DataTableBody table={table} />
      </DataTable>
    </div>
  );
}

import {
  Badge,
  DataTable,
  DataTableBody,
  DataTableFacetFilter,
  DataTableHeader,
  DataTableSearch,
  DataTableToolbar,
  Money,
  useDataTable,
  type BadgeTone,
  type DataTableColumnDef,
} from '@rectio/ui';

type Status = 'Paid' | 'Due' | 'Overdue' | 'Draft';

interface Invoice {
  id: string;
  number: string;
  customer: string;
  status: Status;
  amount: number;
}

const TONES: Record<Status, BadgeTone> = {
  Paid: 'positive',
  Due: 'info',
  Overdue: 'negative',
  Draft: 'neutral',
};

const INVOICES: Invoice[] = [
  { id: '1', number: 'INV-0142', customer: 'Zürich Insurance', status: 'Paid', amount: 12_400 },
  { id: '2', number: 'INV-0143', customer: 'Lufthansa Technik', status: 'Due', amount: 4_120.5 },
  { id: '3', number: 'INV-0144', customer: 'Figma', status: 'Overdue', amount: 760 },
  { id: '4', number: 'INV-0145', customer: 'Hotel Bristol', status: 'Due', amount: 5_380 },
  { id: '5', number: 'INV-0146', customer: 'Atelier Ostrów', status: 'Draft', amount: 1_915 },
  { id: '6', number: 'INV-0147', customer: 'Nordlicht Studio', status: 'Paid', amount: 2_240 },
  { id: '7', number: 'INV-0148', customer: 'Café Müller', status: 'Overdue', amount: 318.4 },
];

const columns: DataTableColumnDef<Invoice>[] = [
  {
    accessorKey: 'number',
    header: 'Invoice',
    meta: { className: 'hidden sm:table-cell' },
    cell: ({ row }) => <span className="numeric text-fg-muted">{row.original.number}</span>,
  },
  { accessorKey: 'customer', header: 'Customer', sortFn: 'text' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge tone={TONES[row.original.status]}>{row.original.status}</Badge>,
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    enableGlobalFilter: false,
    meta: { align: 'end' },
    cell: ({ row }) => <Money amount={row.original.amount} currency="EUR" locale="en-GB" />,
  },
];

/** A toolbar with search and a status facet over a table; `filter` starts it filtered. */
export function TableFilters({ filter }: { filter: 'none' | 'some' | 'nothing' }) {
  const table = useDataTable({
    data: INVOICES,
    columns,
    getRowId: (invoice) => invoice.id,
    initialState:
      filter === 'some'
        ? { columnFilters: [{ id: 'status', value: ['Due', 'Overdue'] }] }
        : filter === 'nothing'
          ? { globalFilter: 'acme' }
          : {},
  });
  return (
    <div className="flex flex-col gap-3">
      <DataTableToolbar table={table} locale="en-GB">
        <DataTableSearch table={table} label="Search invoices" />
        <DataTableFacetFilter
          table={table}
          column="status"
          label="Status"
          locale="en-GB"
          options={(['Paid', 'Due', 'Overdue', 'Draft'] as const).map((value) => ({
            value,
            label: value,
          }))}
        />
      </DataTableToolbar>
      <DataTable caption="Invoices" hideCaption>
        <DataTableHeader table={table} />
        <DataTableBody table={table} />
      </DataTable>
    </div>
  );
}

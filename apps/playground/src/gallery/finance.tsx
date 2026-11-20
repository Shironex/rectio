import { CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Calendar,
  Checkbox,
  DataTable,
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
  DataTablePagination,
  DatePicker,
  DateRangePicker,
  Field,
  FieldDescription,
  FieldLabel,
  Money,
  ToastProvider,
  selectionColumn,
  useDataTable,
  useToast,
  type DataTableColumnDef,
  type DateRange,
} from '@rectio/ui';
import { useState } from 'react';

import { Row, Section } from './specimen';

type InvoiceState = 'draft' | 'sent' | 'paid' | 'due' | 'overdue';

const INVOICE_STATES: Record<
  InvoiceState,
  { label: string; tone: 'neutral' | 'info' | 'positive' | 'warning' | 'negative' }
> = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Sent', tone: 'info' },
  paid: { label: 'Paid', tone: 'positive' },
  due: { label: 'Due soon', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'negative' },
};

export function BadgeSection() {
  return (
    <Section
      title="Badge"
      note="A state in words, tinted by meaning. Never colour alone: Overdue reads as Overdue in greyscale."
    >
      <Row label="Invoice states" center>
        {Object.values(INVOICE_STATES).map(({ label, tone }) => (
          <Badge key={label} tone={tone}>
            {label}
          </Badge>
        ))}
      </Row>
      <Row label="With icon" center>
        <Badge tone="positive">
          <CheckCircleIcon aria-hidden weight="bold" />
          Reconciled
        </Badge>
        <Badge tone="negative">
          <WarningCircleIcon aria-hidden weight="bold" />
          14 days overdue
        </Badge>
      </Row>
    </Section>
  );
}

export function CheckboxSection() {
  return (
    <Section
      title="Checkbox"
      note="Indeterminate stands for a partial selection, as in a table header."
    >
      <Row label="States" center>
        {(
          [
            ['Unticked', {}],
            ['Ticked', { defaultChecked: true }],
            ['Some rows', { indeterminate: true }],
            ['Locked', { defaultChecked: true, disabled: true }],
          ] as const
        ).map(([label, props]) => (
          <label key={label} className="flex items-center gap-2 text-sm">
            <Checkbox {...props} />
            {label}
          </label>
        ))}
      </Row>
    </Section>
  );
}

interface Invoice {
  id: string;
  number: string;
  customer: string;
  due: Date;
  state: InvoiceState;
  amount: number;
}

const INVOICES: Invoice[] = [
  {
    id: 'i1',
    number: 'INV-2041',
    customer: 'Hale & Son',
    due: new Date(2026, 2, 4),
    state: 'overdue',
    amount: 4820,
  },
  {
    id: 'i2',
    number: 'INV-2042',
    customer: 'Nordhaven Freight',
    due: new Date(2026, 2, 21),
    state: 'sent',
    amount: 12600.5,
  },
  {
    id: 'i3',
    number: 'INV-2043',
    customer: 'Atelier Brunner',
    due: new Date(2026, 2, 12),
    state: 'paid',
    amount: 980,
  },
  {
    id: 'i4',
    number: 'INV-2044',
    customer: 'Ostrava Steelworks',
    due: new Date(2026, 2, 16),
    state: 'due',
    amount: 7315.25,
  },
  {
    id: 'i5',
    number: 'INV-2045',
    customer: 'Lindqvist Studio',
    due: new Date(2026, 2, 30),
    state: 'draft',
    amount: 2150,
  },
];

const due = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

const invoiceColumns: DataTableColumnDef<Invoice>[] = [
  selectionColumn<Invoice>({ rowLabel: (row) => `Select ${row.original.number}` }),
  {
    accessorKey: 'number',
    header: 'Invoice',
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.number}</span>,
    footer: 'Total',
  },
  { accessorKey: 'customer', header: 'Customer', sortFn: 'text' },
  {
    accessorKey: 'due',
    header: 'Due',
    sortFn: 'datetime',
    cell: ({ row }) => <span className="numeric">{due.format(row.original.due)}</span>,
  },
  {
    accessorKey: 'state',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => {
      const { label, tone } = INVOICE_STATES[row.original.state];
      return <Badge tone={tone}>{label}</Badge>;
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount, EUR',
    meta: { align: 'end', label: 'Amount' },
    cell: ({ row }) => <Money amount={row.original.amount} currency="EUR" locale="en-IE" />,
    footer: ({ table }) => (
      <Money
        amount={table.getRowModel().rows.reduce((total, row) => total + row.original.amount, 0)}
        currency="EUR"
        locale="en-IE"
        className="font-strong"
      />
    ),
  },
];

function Invoices({
  data = INVOICES,
  loading = false,
  paginate = false,
}: {
  data?: Invoice[];
  loading?: boolean;
  paginate?: boolean;
}) {
  const table = useDataTable({
    data,
    columns: invoiceColumns,
    getRowId: (invoice) => invoice.id,
    paginate,
    initialState: {
      sorting: [{ id: 'amount', desc: true }],
      rowSelection: { i2: true },
      pagination: { pageIndex: 0, pageSize: 3 },
    },
  });
  return (
    <div className="w-full">
      <DataTable caption="Invoices" hideCaption>
        <DataTableHeader table={table} />
        <DataTableBody
          table={table}
          loading={loading}
          loadingRows={3}
          empty={
            <span className="flex flex-col items-center gap-3">
              <span className="flex flex-col items-center gap-1">
                <span className="font-medium text-fg">No invoices match these filters</span>
                <span>Overdue, sent to Nordhaven Freight, due this week.</span>
              </span>
              <Button variant="secondary" size="sm">
                Clear filters
              </Button>
            </span>
          }
        />
        {!loading && data.length > 0 && !paginate && <DataTableFooter table={table} />}
      </DataTable>
      {paginate && <DataTablePagination table={table} locale="en-IE" />}
    </div>
  );
}

export function DataTableSection() {
  return (
    <Section
      title="Data table"
      note="Amounts align right in tabular figures; headers sort and say so to screen readers. Compose header, body and footer from one table instance."
    >
      <Row label="Sorted, one selected">
        <Invoices />
      </Row>
      <Row label="Paged, compact">
        <div data-density="compact" className="w-full">
          <Invoices paginate />
        </div>
      </Row>
      <Row label="Loading">
        <Invoices data={[]} loading />
      </Row>
      <Row label="Empty">
        <Invoices data={[]} />
      </Row>
    </Section>
  );
}

const FIXED_MONTH = new Date(2026, 2, 1);
/** A fixed today, so the today marker lands in the shown month in every screenshot. */
const FIXED_TODAY = new Date(2026, 2, 19);

export function DateSection() {
  const [gb, setGb] = useState<Date | null>(new Date(2026, 2, 19));
  const [us, setUs] = useState<Date | null>(new Date(2026, 2, 19));
  const [period, setPeriod] = useState<DateRange | undefined>({
    from: new Date(2026, 2, 2),
    to: new Date(2026, 2, 13),
  });
  return (
    <Section
      title="Date"
      note="Type in the locale's pattern or open the calendar (Alt + Down). The week starts where the locale starts it."
    >
      <Row label="Locales">
        <Field className="w-56">
          <FieldLabel>Invoice date</FieldLabel>
          <DatePicker locale="en-GB" value={gb} onValueChange={setGb} />
          <FieldDescription>en-GB</FieldDescription>
        </Field>
        <Field className="w-56">
          <FieldLabel>Invoice date</FieldLabel>
          <DatePicker locale="en-US" value={us} onValueChange={setUs} />
          <FieldDescription>en-US</FieldDescription>
        </Field>
      </Row>
      <Row label="Period">
        <DateRangePicker
          aria-label="Statement period"
          locale="en-GB"
          value={period}
          onValueChange={setPeriod}
        />
      </Row>
      <Row label="Range, closed days">
        <div className="flex flex-col gap-2">
          <div className="w-fit rounded-(--rx-popover-radius) border border-line bg-surface-overlay">
            <Calendar
              mode="range"
              locale="en-GB"
              defaultMonth={FIXED_MONTH}
              today={FIXED_TODAY}
              selected={period}
              onSelect={setPeriod}
              disabled={{ after: FIXED_TODAY }}
              required={false}
            />
          </div>
          <p className="max-w-72 text-sm text-fg-muted">
            Boxed is today. Struck days have no statement yet; muted days belong to the months
            around.
          </p>
        </div>
      </Row>
    </Section>
  );
}

function ToastButtons() {
  const toast = useToast();
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          toast.add({
            type: 'success',
            title: 'Invoice sent',
            description: 'INV-2042 to Nordhaven Freight.',
          });
        }}
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          toast.add({
            type: 'error',
            title: 'Payment run failed',
            description: 'The bank rejected the file. Nothing was paid.',
            priority: 'high',
          });
        }}
      >
        Error
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          const id = toast.add({
            type: 'success',
            title: 'Invoice archived',
            description: 'INV-2043, €980.00',
            actionProps: {
              children: 'Undo',
              onClick: () => {
                toast.close(id);
              },
            },
          });
        }}
      >
        With undo
      </Button>
    </>
  );
}

export function ToastSection() {
  return (
    <Section
      title="Toast"
      note="Confirms what just happened, with an icon and words. Undo lives in the toast; errors that need action belong in the page."
    >
      <Row label="Trigger" center>
        <ToastProvider timeout={8000}>
          <ToastButtons />
        </ToastProvider>
      </Row>
    </Section>
  );
}

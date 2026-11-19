import { PlusIcon } from '@phosphor-icons/react';
import {
  DataTable,
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
  DataTableSort,
  cn,
  useDataTable,
  type DataTableColumnDef,
} from '@rectio/ui';
import { useMemo, useState } from 'react';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { ChoiceSelect, type Choice } from '../lib/choice-select';
import { Figures } from '../lib/figures';
import { formatShortDate, sumMoney, resolveLocale } from '../lib/finance';
import { Segmented } from '../lib/segmented';
import { StateBadge } from '../lib/state-badge';
import {
  balanceDue,
  dueText,
  inPeriod,
  invoiceState,
  invoiceTotals,
  matchesFilter,
  type InvoicePeriod,
  type InvoiceState,
  type InvoiceSummary,
  type StatusFilter,
} from './invoice-list.logic';

export interface InvoiceListProps {
  invoices: readonly InvoiceSummary[];
  /** ISO 4217 code every invoice is in. */
  currency: string;
  /** BCP 47 locale for figures and dates. Defaults to the runtime locale. */
  locale?: string;
  /** The day overdue is measured from. Pass it in so the list agrees with your server. */
  today?: Date;
  title?: string;
  defaultPeriod?: InvoicePeriod;
  defaultFilter?: StatusFilter;
  /** Opens an invoice; the number becomes a button when given. */
  onOpenInvoice?: (invoice: InvoiceSummary) => void;
  /** Shows a New invoice button. */
  onCreateInvoice?: () => void;
  className?: string;
}

const PERIODS: readonly Choice<InvoicePeriod>[] = [
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
];

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  outstanding: 'Outstanding',
  overdue: 'Overdue',
  paid: 'Paid',
  draft: 'Draft',
};

interface Row {
  invoice: InvoiceSummary;
  state: InvoiceState;
  balance: number;
  due: string | null;
}

/** On phones Issued and Due fold under the customer, so the amount never leaves the screen. */
const WIDE = 'hidden @2xl:table-cell';

function InvoiceNumber({
  invoice,
  onOpen,
}: {
  invoice: InvoiceSummary;
  onOpen: ((invoice: InvoiceSummary) => void) | undefined;
}) {
  if (onOpen === undefined) return <span className="numeric">{invoice.number}</span>;
  return (
    <button
      type="button"
      onClick={() => {
        onOpen(invoice);
      }}
      className={cn(
        'cursor-pointer rounded-badge text-start numeric text-fg underline decoration-line-strong underline-offset-4',
        'hover:decoration-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        'pointer-coarse:min-h-(--rx-control-height-touch)',
      )}
    >
      {invoice.number}
    </button>
  );
}

/**
 * Receivables at a glance: what is outstanding and overdue, then every invoice with its state,
 * filtered by status and by the period it was issued in. Data-agnostic: pass your invoices, the
 * currency and today's date.
 */
export function InvoiceList({
  invoices,
  currency,
  locale: requestedLocale,
  today = new Date(),
  title = 'Invoices',
  defaultPeriod = 'quarter',
  defaultFilter = 'all',
  onOpenInvoice,
  onCreateInvoice,
  className,
}: InvoiceListProps) {
  const locale = resolveLocale(requestedLocale);
  const { Button, Money } = useBlockParts();
  const [period, setPeriod] = useState<InvoicePeriod>(defaultPeriod);
  const [filter, setFilter] = useState<StatusFilter>(defaultFilter);

  const inRange = invoices.filter((invoice) => inPeriod(invoice.issued, period, today));
  const totals = invoiceTotals(inRange, today, currency);
  const rows: Row[] = inRange
    .map((invoice) => ({
      invoice,
      state: invoiceState(invoice, today),
      balance: invoice.status === 'sent' ? balanceDue(invoice, currency) : invoice.total,
      due: dueText(invoice, today),
    }))
    .filter((row) => matchesFilter(row.state, filter));

  const columns = useMemo<DataTableColumnDef<Row>[]>(
    () => [
      {
        id: 'number',
        accessorFn: (row) => row.invoice.number,
        header: 'Invoice',
        sortFn: 'alphanumeric',
        meta: { className: 'hidden whitespace-nowrap @xl:table-cell' },
        cell: ({ row }) => <InvoiceNumber invoice={row.original.invoice} onOpen={onOpenInvoice} />,
      },
      {
        id: 'customer',
        accessorFn: (row) => row.invoice.customer,
        header: 'Customer',
        sortFn: 'text',
        cell: ({ row }) => {
          const { invoice, due, state } = row.original;
          return (
            <>
              {/* Narrow: the number leads the row, since its own column is hidden. */}
              <span className="block @xl:hidden">
                <InvoiceNumber invoice={invoice} onOpen={onOpenInvoice} />
              </span>
              <span className="block">{invoice.customer}</span>
              <span className="block text-sm text-fg-muted @2xl:hidden">
                <span className="numeric">{formatShortDate(invoice.issued, locale)}</span>
                {due !== null && (
                  <span className={cn(state === 'overdue' && 'text-negative-strong')}>, {due}</span>
                )}
              </span>
            </>
          );
        },
        footer: ({ table }) => {
          const shown = table.getRowModel().rows;
          const voided = shown.filter((r) => r.original.state === 'void').length;
          return (
            <span className="flex flex-col text-sm">
              <span className="font-medium whitespace-nowrap">
                Total, {shown.length} {shown.length === 1 ? 'invoice' : 'invoices'}
              </span>
              <span className="text-fg-muted">
                Owed on sent invoices{voided > 0 && `, ${String(voided)} void not counted`}
              </span>
            </span>
          );
        },
      },
      {
        id: 'issued',
        accessorFn: (row) => row.invoice.issued,
        header: 'Issued',
        sortFn: 'datetime',
        meta: { className: `${WIDE} whitespace-nowrap` },
        cell: ({ row }) => (
          <span className="text-fg-muted numeric">
            {formatShortDate(row.original.invoice.issued, locale)}
          </span>
        ),
      },
      {
        id: 'due',
        accessorFn: (row) => row.invoice.due,
        header: 'Due',
        sortFn: 'datetime',
        meta: { className: `${WIDE} whitespace-nowrap` },
        cell: ({ row }) => {
          const { invoice, due, state } = row.original;
          return (
            <span className="flex flex-col">
              <span className="numeric">{formatShortDate(invoice.due, locale)}</span>
              {due !== null && (
                <span
                  className={cn(
                    'text-sm',
                    state === 'overdue' ? 'text-negative-strong' : 'text-fg-muted',
                  )}
                >
                  {due}
                </span>
              )}
            </span>
          );
        },
      },
      {
        id: 'state',
        accessorFn: (row) => row.state,
        header: 'Status',
        sortFn: 'text',
        meta: { className: 'hidden @xl:table-cell' },
        cell: ({ row }) => {
          const { invoice, state } = row.original;
          const partial =
            state !== 'paid' && (invoice.amountPaid ?? 0) > 0 && invoice.status === 'sent';
          return <StateBadge state={partial && state === 'due' ? 'partial' : state} />;
        },
      },
      {
        id: 'amount',
        accessorFn: (row) => row.balance,
        header: `Amount, ${currency}`,
        sortFn: 'basic',
        meta: { align: 'end', label: 'Amount' },
        cell: ({ row }) => {
          const { invoice, state, balance } = row.original;
          const partial = invoice.status === 'sent' && balance !== invoice.total;
          return (
            <span className="flex flex-col items-end">
              <Money
                amount={balance}
                currency={currency}
                locale={locale}
                className={cn(state === 'void' && 'text-fg-muted line-through')}
              />
              {partial && (
                <span className="text-sm text-fg-muted">
                  of <Money amount={invoice.total} currency={currency} locale={locale} />
                </span>
              )}
              <span className="mt-1 @xl:hidden">
                <StateBadge state={state} />
              </span>
            </span>
          );
        },
        footer: ({ table }) => (
          <Money
            amount={sumMoney(
              table
                .getRowModel()
                .rows.filter((r) => r.original.state !== 'void')
                .map((r) => r.original.balance),
              currency,
            )}
            currency={currency}
            locale={locale}
            className="font-strong"
          />
        ),
      },
    ],
    [currency, locale, onOpenInvoice, Money],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.invoice.id,
    initialState: { sorting: [{ id: 'due', desc: false }] },
  });

  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? '';

  return (
    <BlockPanel
      title={title}
      description={`${periodLabel}, ${String(inRange.length)} ${inRange.length === 1 ? 'invoice' : 'invoices'}`}
      actions={
        <>
          <ChoiceSelect label="Period" value={period} onValueChange={setPeriod} choices={PERIODS} />
          {onCreateInvoice !== undefined && (
            <Button onClick={onCreateInvoice}>
              <PlusIcon aria-hidden weight="bold" className="size-4" />
              New invoice
            </Button>
          )}
        </>
      }
      className={className}
      bodyClassName="gap-4"
    >
      <Figures
        currency={currency}
        locale={locale}
        items={[
          {
            label: 'Outstanding',
            amount: totals.outstanding,
            note: `${String(totals.counts.outstanding)} open`,
          },
          {
            label: 'Overdue',
            amount: totals.overdue,
            note:
              totals.overdueCount === 0
                ? 'Nothing overdue'
                : `${String(totals.overdueCount)} past due date`,
            ...(totals.overdueCount > 0 ? { emphasis: 'negative' as const } : {}),
          },
          {
            label: 'Paid',
            amount: totals.paid,
            note: `${String(totals.counts.paid)} settled`,
          },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Status"
          value={filter}
          onValueChange={setFilter}
          options={(Object.keys(FILTER_LABELS) as StatusFilter[]).map((value) => ({
            value,
            label: FILTER_LABELS[value],
            hint: totals.counts[value],
          }))}
        />
        <DataTableSort table={table} className="w-full @xl:hidden" />
      </div>

      <DataTable caption={`${title}, ${FILTER_LABELS[filter].toLowerCase()}`} hideCaption>
        <DataTableHeader table={table} />
        <DataTableBody
          table={table}
          empty={
            <span className="flex flex-col items-center gap-3">
              <span className="flex flex-col items-center gap-1">
                <span className="font-medium text-fg">
                  {filter === 'overdue'
                    ? 'Nothing is overdue'
                    : `No ${filter === 'all' ? '' : `${FILTER_LABELS[filter].toLowerCase()} `}invoices in this period`}
                </span>
                <span>Widen the period or show every status.</span>
              </span>
              {(filter !== 'all' || period !== 'all') && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setFilter('all');
                    setPeriod('all');
                  }}
                >
                  Show all invoices
                </Button>
              )}
            </span>
          }
        />
        {rows.length > 0 && <DataTableFooter table={table} />}
      </DataTable>
    </BlockPanel>
  );
}

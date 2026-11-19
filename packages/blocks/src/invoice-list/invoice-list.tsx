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
import { useMemo, useState, type ReactNode } from 'react';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { EmptyNote } from '../lib/empty-note';
import { ChoiceSelect, type Choice } from '../lib/choice-select';
import { Figures } from '../lib/figures';
import { formatShortDate, sumMoney, resolveLocale } from '../lib/finance';
import { COMMON_MESSAGES, mergeMessages, type CommonMessages } from '../lib/messages';
import { Segmented } from '../lib/segmented';
import { StateBadge } from '../lib/state-badge';
import {
  balanceDue,
  dueInfo,
  englishDue,
  inPeriod,
  invoiceState,
  invoiceTotals,
  matchesFilter,
  type DueInfo,
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
  /** Shown in the empty state under its note, such as a button that creates the first invoice. */
  emptyAction?: ReactNode;
  /** The block's words; pass the keys you change. See `INVOICE_LIST_MESSAGES`. */
  messages?: Partial<InvoiceListMessages>;
  className?: string;
}

export interface InvoiceListMessages extends CommonMessages {
  title: string;
  /** Under the title: "This quarter, 14 invoices". */
  description: (period: string, count: number) => string;
  periods: Record<InvoicePeriod, string>;
  filters: Record<StatusFilter, string>;
  periodLabel: string;
  statusLabel: string;
  newInvoice: string;
  emptyTitle: string;
  emptyNote: string;
  outstanding: string;
  overdue: string;
  paid: string;
  openNote: (count: number) => string;
  nothingOverdue: string;
  pastDueNote: (count: number) => string;
  settledNote: (count: number) => string;
  /** The table's accessible caption, such as "Invoices, overdue". */
  tableCaption: (title: string, filter: string) => string;
  invoice: string;
  customer: string;
  issued: string;
  due: string;
  status: string;
  /** The amount column's header. */
  amountHeader: (currency: string) => string;
  /** The amount column's name in the Sort by list. */
  amount: string;
  /** Under a customer on a narrow block: "Issued 3 Mar". */
  issuedOn: (date: ReactNode) => ReactNode;
  /** The due date in words, from a code; the default is English. */
  dueText: (info: DueInfo) => string;
  /** The footer's first line: "Total, 6 invoices". */
  totalRow: (count: number) => string;
  /** The footer's second line; `voided` is how many void invoices are left out. */
  totalNote: (voided: number) => string;
  /** Under a part-paid amount: "€200 paid of €500". */
  paidOf: (paid: ReactNode, total: ReactNode) => ReactNode;
  sortLabel: string;
  sortPlaceholder: string;
  sortDescending: string;
  /** The in-table empty text when the status or period hides every invoice. */
  noneTitle: (filter: StatusFilter) => string;
  noneNote: string;
  showAll: string;
}

const INVOICE_LIST_FILTER_WORDS = {
  outstanding: 'outstanding',
  overdue: 'overdue',
  paid: 'paid',
  draft: 'draft',
} as const;

export const INVOICE_LIST_MESSAGES: InvoiceListMessages = {
  ...COMMON_MESSAGES,
  title: 'Invoices',
  description: (period, count) =>
    `${period}, ${String(count)} ${count === 1 ? 'invoice' : 'invoices'}`,
  periods: {
    'this-month': 'This month',
    'last-month': 'Last month',
    quarter: 'This quarter',
    year: 'This year',
    all: 'All time',
  },
  filters: {
    all: 'All',
    outstanding: 'Outstanding',
    overdue: 'Overdue',
    paid: 'Paid',
    draft: 'Draft',
  },
  periodLabel: 'Period',
  statusLabel: 'Status',
  newInvoice: 'New invoice',
  emptyTitle: 'No invoices yet',
  emptyNote: 'Invoices you create appear here with what is outstanding, overdue and paid.',
  outstanding: 'Outstanding',
  overdue: 'Overdue',
  paid: 'Paid',
  openNote: (count) => `${String(count)} open`,
  nothingOverdue: 'Nothing overdue',
  pastDueNote: (count) => `${String(count)} past due date`,
  settledNote: (count) => `${String(count)} settled`,
  tableCaption: (title, filter) => `${title}, ${filter.toLowerCase()}`,
  invoice: 'Invoice',
  customer: 'Customer',
  issued: 'Issued',
  due: 'Due',
  status: 'Status',
  amountHeader: (currency) => `Amount, ${currency}`,
  amount: 'Amount',
  issuedOn: (date) => <>Issued {date}</>,
  dueText: englishDue,
  totalRow: (count) => `Total, ${String(count)} ${count === 1 ? 'invoice' : 'invoices'}`,
  totalNote: (voided) =>
    `Sum of the amounts shown${voided > 0 ? `, ${String(voided)} void not counted` : ''}`,
  paidOf: (paid, total) => (
    <>
      {paid} paid of {total}
    </>
  ),
  sortLabel: 'Sort by',
  sortPlaceholder: 'Original order',
  sortDescending: 'Descending',
  noneTitle: (filter) =>
    filter === 'overdue'
      ? 'Nothing is overdue'
      : `No ${filter === 'all' ? '' : `${INVOICE_LIST_FILTER_WORDS[filter]} `}invoices in this period`,
  noneNote: 'Widen the period or show every status.',
  showAll: 'Show all invoices',
};

interface Row {
  invoice: InvoiceSummary;
  state: InvoiceState;
  balance: number;
  due: DueInfo | null;
}

/**
 * Narrower blocks fold Issued, then Due, under the customer, so the amount never leaves the panel:
 * Due gets its own column from a 48rem block, Issued from 56rem.
 */
const DUE_COLUMN = 'hidden @3xl:table-cell';
const ISSUED_COLUMN = 'hidden @4xl:table-cell';

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
  title,
  defaultPeriod = 'quarter',
  defaultFilter = 'all',
  onOpenInvoice,
  onCreateInvoice,
  emptyAction,
  messages,
  className,
}: InvoiceListProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(INVOICE_LIST_MESSAGES, messages);
  const heading = title ?? m.title;
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
      due: dueInfo(invoice, today),
    }))
    .filter((row) => matchesFilter(row.state, filter));

  const columns = useMemo<DataTableColumnDef<Row>[]>(
    () => [
      {
        id: 'number',
        accessorFn: (row) => row.invoice.number,
        header: m.invoice,
        sortFn: 'alphanumeric',
        meta: { className: 'hidden whitespace-nowrap @xl:table-cell' },
        cell: ({ row }) => <InvoiceNumber invoice={row.original.invoice} onOpen={onOpenInvoice} />,
      },
      {
        id: 'customer',
        accessorFn: (row) => row.invoice.customer,
        header: m.customer,
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
              <span className="block text-sm text-fg-muted @4xl:hidden">
                {m.issuedOn(
                  <span className="numeric">{formatShortDate(invoice.issued, locale)}</span>,
                )}
                {due !== null && (
                  <span
                    className={cn('@3xl:hidden', state === 'overdue' && 'text-negative-strong')}
                  >
                    , {m.dueText(due)}
                  </span>
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
              <span className="font-medium whitespace-nowrap">{m.totalRow(shown.length)}</span>
              <span className="text-fg-muted">{m.totalNote(voided)}</span>
            </span>
          );
        },
      },
      {
        id: 'issued',
        accessorFn: (row) => row.invoice.issued,
        header: m.issued,
        sortFn: 'datetime',
        meta: { className: `${ISSUED_COLUMN} whitespace-nowrap` },
        cell: ({ row }) => (
          <span className="text-fg-muted numeric">
            {formatShortDate(row.original.invoice.issued, locale)}
          </span>
        ),
      },
      {
        id: 'due',
        accessorFn: (row) => row.invoice.due,
        header: m.due,
        sortFn: 'datetime',
        meta: { className: `${DUE_COLUMN} whitespace-nowrap` },
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
                  {m.dueText(due)}
                </span>
              )}
            </span>
          );
        },
      },
      {
        id: 'state',
        accessorFn: (row) => row.state,
        header: m.status,
        sortFn: 'text',
        meta: { className: 'hidden @xl:table-cell' },
        cell: ({ row }) => {
          const { invoice, state } = row.original;
          const partial =
            state !== 'paid' && (invoice.amountPaid ?? 0) > 0 && invoice.status === 'sent';
          const shown = partial && state === 'due' ? 'partial' : state;
          return <StateBadge state={shown} label={m.states[shown]} />;
        },
      },
      {
        id: 'amount',
        accessorFn: (row) => row.balance,
        header: m.amountHeader(currency),
        sortFn: 'basic',
        meta: { align: 'end', label: m.amount },
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
                <span className="text-end text-sm text-fg-muted @3xl:whitespace-nowrap">
                  {m.paidOf(
                    <Money amount={invoice.total - balance} currency={currency} locale={locale} />,
                    <Money amount={invoice.total} currency={currency} locale={locale} />,
                  )}
                </span>
              )}
              <span className="mt-1 @xl:hidden">
                <StateBadge state={state} label={m.states[state]} />
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
    [currency, locale, onOpenInvoice, Money, m],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.invoice.id,
    initialState: { sorting: [{ id: 'due', desc: false }] },
  });

  const periodChoices = useMemo<Choice<InvoicePeriod>[]>(
    () =>
      (Object.keys(m.periods) as InvoicePeriod[]).map((value) => ({
        value,
        label: m.periods[value],
      })),
    [m.periods],
  );
  const periodLabel = m.periods[period];

  return (
    <BlockPanel
      title={heading}
      description={m.description(periodLabel, inRange.length)}
      actions={
        <>
          {invoices.length > 0 && (
            <ChoiceSelect
              label={m.periodLabel}
              value={period}
              onValueChange={setPeriod}
              choices={periodChoices}
            />
          )}
          {onCreateInvoice !== undefined && (
            <Button onClick={onCreateInvoice}>
              <PlusIcon aria-hidden weight="bold" className="size-4" />
              {m.newInvoice}
            </Button>
          )}
        </>
      }
      className={className}
      bodyClassName="gap-4"
    >
      {invoices.length === 0 ? (
        <EmptyNote title={m.emptyTitle} action={emptyAction}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <>
          <Figures
            currency={currency}
            locale={locale}
            items={[
              {
                label: m.outstanding,
                amount: totals.outstanding,
                note: m.openNote(totals.counts.outstanding),
              },
              {
                label: m.overdue,
                amount: totals.overdue,
                note:
                  totals.overdueCount === 0 ? m.nothingOverdue : m.pastDueNote(totals.overdueCount),
                ...(totals.overdueCount > 0 ? { emphasis: 'negative' as const } : {}),
              },
              {
                label: m.paid,
                amount: totals.paid,
                note: m.settledNote(totals.counts.paid),
              },
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented
              label={m.statusLabel}
              value={filter}
              onValueChange={setFilter}
              options={(Object.keys(m.filters) as StatusFilter[]).map((value) => ({
                value,
                label: m.filters[value],
                hint: totals.counts[value],
              }))}
            />
            <DataTableSort
              table={table}
              label={m.sortLabel}
              placeholder={m.sortPlaceholder}
              descendingLabel={m.sortDescending}
              className="w-full @xl:hidden"
            />
          </div>

          <DataTable caption={m.tableCaption(heading, m.filters[filter])} hideCaption>
            {/* On a narrow block the Sort by control above sorts; the header stays for screen readers. */}
            <DataTableHeader table={table} className="@max-xl:sr-only" />
            <DataTableBody
              table={table}
              empty={
                <span className="flex flex-col items-center gap-3">
                  <span className="flex flex-col items-center gap-1">
                    <span className="font-medium text-fg">{m.noneTitle(filter)}</span>
                    <span>{m.noneNote}</span>
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
                      {m.showAll}
                    </Button>
                  )}
                </span>
              }
            />
            {rows.length > 0 && <DataTableFooter table={table} />}
          </DataTable>
        </>
      )}
    </BlockPanel>
  );
}

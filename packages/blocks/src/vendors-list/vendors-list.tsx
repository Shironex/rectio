import { MagnifyingGlassIcon, PlusIcon, StorefrontIcon } from '@phosphor-icons/react';
import {
  DataTable,
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
  DataTableSort,
  Field,
  FieldLabel,
  Input,
  cn,
  useDataTable,
  type DataTableColumnDef,
} from '@rectio/ui';
import { useMemo, useState, type ReactNode } from 'react';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { EmptyNote } from '../lib/empty-note';
import { Figures } from '../lib/figures';
import { formatShortDate, resolveLocale, sumMoney } from '../lib/finance';
import { COMMON_MESSAGES, mergeMessages, type CommonMessages } from '../lib/messages';
import { Segmented } from '../lib/segmented';
import { StateBadge } from '../lib/state-badge';
import {
  VENDOR_FILTERS,
  matchesVendorFilter,
  searchVendors,
  vendorFigures,
  vendorTotals,
  type Vendor,
  type VendorFigures,
  type VendorFilter,
} from './vendors-list.logic';

export interface VendorsListProps {
  vendors: readonly Vendor[];
  /** ISO 4217 code every amount is in. */
  currency: string;
  /** BCP 47 locale for figures, dates and name sorting. Defaults to the runtime locale. */
  locale?: string;
  /** The day overdue and "next 7 days" are measured from. Pass it so the list agrees with your server. */
  today?: Date;
  title?: string;
  defaultFilter?: VendorFilter;
  /** How many days ahead the Due soon figure looks. */
  horizonDays?: number;
  /** Opens a vendor; the name becomes a button when given. */
  onOpenVendor?: (vendor: Vendor) => void;
  /** Shows an Add vendor button in the header. */
  onAddVendor?: () => void;
  /** Shown in the empty state under its note, such as a button that imports vendors. */
  emptyAction?: ReactNode;
  /** The block's words; pass the keys you change. See `VENDORS_LIST_MESSAGES`. */
  messages?: Partial<VendorsListMessages>;
  className?: string;
}

export interface VendorsListMessages extends CommonMessages {
  title: string;
  /** Under the title: "12 vendors, €48,200 owed". */
  summary: (count: number, owed: ReactNode) => ReactNode;
  owed: string;
  /** Under the Owed figure: how many vendors you owe anything. */
  owedNote: (vendors: number) => string;
  overdue: string;
  overdueNote: (vendors: number) => string;
  nothingOverdue: string;
  dueSoon: (days: number) => string;
  dueSoonNote: (vendors: number) => string;
  nothingDueSoon: string;
  addVendor: string;
  searchLabel: string;
  searchPlaceholder: string;
  filterLabel: string;
  filters: Record<VendorFilter, string>;
  tableCaption: (filter: string, currency: string) => string;
  vendor: string;
  terms: string;
  /** Payment terms in a cell: "Net 30". */
  termsValue: (days: number) => string;
  nextDue: string;
  /** "Due today", "Due in 3 days": the next due date as the reader thinks of it. */
  dueIn: (days: number) => string;
  nothingDue: string;
  /** In place of a next due date when every unpaid bill is already late. */
  allPastDue: string;
  lastPayment: string;
  lastPaidLine: (date: string) => string;
  noPayments: string;
  status: string;
  balance: string;
  /** Under a balance on a narrow block: "€1,200 overdue". */
  overdueAmount: (amount: ReactNode) => ReactNode;
  sortBy: string;
  sortPlaceholder: string;
  descending: string;
  totalRow: (count: number) => string;
  emptyTitle: string;
  emptyNote: string;
  noResults: (query: string) => string;
  noneInFilter: (filter: string) => string;
  noResultsNote: string;
  clearSearch: string;
}

const vendorsWord = (count: number) => `${String(count)} ${count === 1 ? 'vendor' : 'vendors'}`;

export const VENDORS_LIST_MESSAGES: VendorsListMessages = {
  ...COMMON_MESSAGES,
  title: 'Vendors',
  summary: (count, owed) => (
    <>
      {vendorsWord(count)}, {owed} owed
    </>
  ),
  owed: 'Owed',
  owedNote: (vendors) => (vendors === 0 ? 'Nothing owed' : `To ${vendorsWord(vendors)}`),
  overdue: 'Overdue',
  overdueNote: (vendors) => `${vendorsWord(vendors)} past due`,
  nothingOverdue: 'Nothing overdue',
  dueSoon: (days) => `Due in the next ${String(days)} days`,
  dueSoonNote: (vendors) => `To ${vendorsWord(vendors)}`,
  nothingDueSoon: 'Nothing due soon',
  addVendor: 'Add vendor',
  searchLabel: 'Search vendors',
  searchPlaceholder: 'Name or contact',
  filterLabel: 'Status',
  filters: { all: 'All', active: 'Active', 'on-hold': 'On hold', archived: 'Archived' },
  tableCaption: (filter, currency) => `Vendors, ${filter.toLowerCase()}, amounts in ${currency}`,
  vendor: 'Vendor',
  terms: 'Terms',
  termsValue: (days) => `Net ${String(days)}`,
  nextDue: 'Next due',
  dueIn: (days) =>
    days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${String(days)} days`,
  nothingDue: 'Nothing due',
  allPastDue: 'All past due',
  lastPayment: 'Last payment',
  lastPaidLine: (date) => `Last paid ${date}`,
  noPayments: 'No payments yet',
  status: 'Status',
  balance: 'Balance',
  overdueAmount: (amount) => <>{amount} overdue</>,
  sortBy: 'Sort by',
  sortPlaceholder: 'Original order',
  descending: 'Descending',
  totalRow: (count) => `Total, ${vendorsWord(count)}`,
  emptyTitle: 'No vendors yet',
  emptyNote: 'Suppliers you add appear here with what you owe them and when it falls due.',
  noResults: (query) => `No vendors match "${query}"`,
  noneInFilter: (filter) => `No ${filter.toLowerCase()} vendors`,
  noResultsNote: 'Check the spelling, or search every status.',
  clearSearch: 'Clear search and filter',
};

/** "Due in 3 days" after a comma reads as "due in 3 days". */
const lowerFirst = (text: string, locale: string) =>
  text.charAt(0).toLocaleLowerCase(locale) + text.slice(1);

interface Row {
  vendor: Vendor;
  figures: VendorFigures;
}

/** Narrower blocks fold columns under the vendor, so the balance never leaves the panel. */
const STATUS_COLUMN = 'hidden @xl:table-cell';
const OVERDUE_COLUMN = 'hidden @2xl:table-cell';
const NEXT_DUE_COLUMN = 'hidden @3xl:table-cell';
/** The last columns to get room, from a 64rem block; below it terms read under the vendor's name. */
const WIDE_COLUMN = 'hidden @5xl:table-cell';

function VendorName({
  vendor,
  onOpen,
}: {
  vendor: Vendor;
  onOpen: ((vendor: Vendor) => void) | undefined;
}) {
  if (onOpen === undefined) return <span className="font-medium">{vendor.name}</span>;
  return (
    <button
      type="button"
      onClick={() => {
        onOpen(vendor);
      }}
      className={cn(
        'cursor-pointer rounded-badge text-start font-medium text-fg underline decoration-line-strong underline-offset-4',
        'hover:decoration-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        'pointer-coarse:min-h-(--rx-control-height-touch)',
      )}
    >
      {vendor.name}
    </button>
  );
}

/**
 * Accounts payable by supplier: what you owe, what is overdue and what falls due this week, then
 * every vendor with terms, next due date, last payment and status. Search folds accents, so
 * "muller" finds "Müller". Data-agnostic: pass vendors with their unpaid bills, the currency and today.
 */
export function VendorsList({
  vendors,
  currency,
  locale: requestedLocale,
  today = new Date(),
  title,
  defaultFilter = 'all',
  horizonDays = 7,
  onOpenVendor,
  onAddVendor,
  emptyAction,
  messages,
  className,
}: VendorsListProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(VENDORS_LIST_MESSAGES, messages);
  const { Button, Money } = useBlockParts();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<VendorFilter>(defaultFilter);

  const totals = vendorTotals(vendors, today, currency, horizonDays);
  const owing = vendors.filter((v) => v.bills.length > 0).length;
  const found = searchVendors(vendors, query);
  const counts = vendorTotals(found, today, currency, horizonDays).counts;
  const rows: Row[] = found
    .filter((vendor) => matchesVendorFilter(vendor.status, filter))
    .map((vendor) => ({ vendor, figures: vendorFigures(vendor, today, currency, horizonDays) }));

  const columns = useMemo<DataTableColumnDef<Row>[]>(
    () => [
      {
        id: 'vendor',
        accessorFn: (row) => row.vendor.name,
        header: m.vendor,
        sortFn: 'text',
        cell: ({ row }) => {
          const { vendor, figures } = row.original;
          return (
            <>
              <span className="block">
                <VendorName vendor={vendor} onOpen={onOpenVendor} />
              </span>
              {vendor.contact !== undefined && (
                <span className="block text-sm text-fg-muted">{vendor.contact}</span>
              )}
              {/* Narrow: terms, next due and last payment share one quieter line under the name. */}
              <span className="block text-xs text-fg-muted @5xl:hidden">
                {m.termsValue(vendor.termsDays)}
                <span
                  className={cn(
                    '@3xl:hidden',
                    // Keeps the urgency of the Next due column once it folds away.
                    figures.nextDueIn !== undefined && figures.nextDueIn <= horizonDays
                      ? 'text-warning-strong'
                      : figures.nextDueIn === undefined && figures.overdueCount > 0
                        ? 'text-negative-strong'
                        : undefined,
                  )}
                >
                  ,{' '}
                  {lowerFirst(
                    figures.nextDueIn !== undefined
                      ? m.dueIn(figures.nextDueIn)
                      : figures.overdueCount > 0
                        ? m.allPastDue
                        : m.nothingDue,
                    locale,
                  )}
                </span>
                {vendor.lastPayment !== undefined &&
                  `, ${lowerFirst(m.lastPaidLine(formatShortDate(vendor.lastPayment.date, locale)), locale)}`}
              </span>
            </>
          );
        },
        footer: ({ table }) => (
          <span className="text-sm font-medium whitespace-nowrap">
            {m.totalRow(table.getRowModel().rows.length)}
          </span>
        ),
      },
      {
        id: 'terms',
        accessorFn: (row) => row.vendor.termsDays,
        header: m.terms,
        sortFn: 'basic',
        meta: { className: `${WIDE_COLUMN} whitespace-nowrap` },
        cell: ({ row }) => (
          <span className="text-fg-muted numeric">
            {m.termsValue(row.original.vendor.termsDays)}
          </span>
        ),
      },
      {
        id: 'nextDue',
        accessorFn: (row) => row.figures.nextDue,
        header: m.nextDue,
        sortFn: 'datetime',
        sortUndefined: 'last',
        meta: { className: `${NEXT_DUE_COLUMN} whitespace-nowrap` },
        cell: ({ row }) => {
          const { nextDue, nextDueIn } = row.original.figures;
          if (nextDue === undefined || nextDueIn === undefined)
            return row.original.figures.overdueCount > 0 ? (
              <span className="text-negative-strong">{m.allPastDue}</span>
            ) : (
              <span className="text-fg-subtle">{m.nothingDue}</span>
            );
          return (
            <span className="flex flex-col">
              <span className="numeric">{formatShortDate(nextDue, locale)}</span>
              <span
                className={cn(
                  'text-sm',
                  nextDueIn <= horizonDays ? 'text-warning-strong' : 'text-fg-muted',
                )}
              >
                {m.dueIn(nextDueIn)}
              </span>
            </span>
          );
        },
      },
      {
        id: 'lastPayment',
        accessorFn: (row) => row.vendor.lastPayment?.date,
        header: m.lastPayment,
        sortFn: 'datetime',
        sortUndefined: 'last',
        meta: { className: `${WIDE_COLUMN} whitespace-nowrap` },
        cell: ({ row }) => {
          const last = row.original.vendor.lastPayment;
          if (last === undefined) return <span className="text-fg-subtle">{m.noPayments}</span>;
          return (
            <span className="flex flex-col">
              <span className="numeric">{formatShortDate(last.date, locale)}</span>
              <Money
                amount={last.amount}
                currency={currency}
                locale={locale}
                className="text-sm text-fg-muted"
              />
            </span>
          );
        },
      },
      {
        id: 'status',
        accessorFn: (row) => m.states[row.vendor.status],
        header: m.status,
        sortFn: 'text',
        meta: { className: STATUS_COLUMN },
        cell: ({ row }) => {
          const { status } = row.original.vendor;
          return <StateBadge state={status} label={m.states[status]} />;
        },
      },
      {
        id: 'overdue',
        accessorFn: (row) => row.figures.overdue,
        header: m.overdue,
        sortFn: 'basic',
        meta: { align: 'end', className: OVERDUE_COLUMN },
        cell: ({ row }) => {
          const { overdue } = row.original.figures;
          // Blank when nothing is late, so the red figures that need action stand alone.
          if (overdue === 0) return <span className="sr-only">{m.nothingOverdue}</span>;
          return (
            <Money
              amount={overdue}
              currency={currency}
              locale={locale}
              className="font-medium text-negative-strong"
            />
          );
        },
        footer: ({ table }) => (
          <Money
            amount={sumMoney(
              table.getRowModel().rows.map((r) => r.original.figures.overdue),
              currency,
            )}
            currency={currency}
            locale={locale}
            className="font-strong"
          />
        ),
      },
      {
        id: 'balance',
        accessorFn: (row) => row.figures.balance,
        header: `${m.balance}, ${currency}`,
        sortFn: 'basic',
        meta: { align: 'end', label: m.balance, className: '@max-xl:align-top' },
        cell: ({ row }) => {
          const { vendor, figures } = row.original;
          return (
            <span className="flex flex-col items-end gap-1">
              <Money
                amount={figures.balance}
                currency={currency}
                locale={locale}
                className={cn('font-medium', figures.balance === 0 && 'text-fg-muted')}
              />
              {figures.overdue !== 0 && (
                <span className="text-end text-sm text-negative-strong @2xl:hidden">
                  {m.overdueAmount(
                    <Money amount={figures.overdue} currency={currency} locale={locale} />,
                  )}
                </span>
              )}
              <span className="@xl:hidden">
                <StateBadge state={vendor.status} label={m.states[vendor.status]} />
              </span>
            </span>
          );
        },
        footer: ({ table }) => (
          <Money
            amount={sumMoney(
              table.getRowModel().rows.map((r) => r.original.figures.balance),
              currency,
            )}
            currency={currency}
            locale={locale}
            className="font-strong"
          />
        ),
      },
    ],
    [currency, locale, onOpenVendor, Money, m, horizonDays],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => row.vendor.id,
    initialState: { sorting: [{ id: 'overdue', desc: true }] },
  });

  const filtered = query.trim() !== '' || filter !== 'all';

  return (
    <BlockPanel
      title={title ?? m.title}
      description={
        vendors.length === 0
          ? undefined
          : m.summary(
              vendors.length,
              <Money amount={totals.owed} currency={currency} locale={locale} />,
            )
      }
      actions={
        onAddVendor !== undefined && (
          <Button onClick={onAddVendor}>
            <PlusIcon aria-hidden weight="bold" className="size-4" />
            {m.addVendor}
          </Button>
        )
      }
      className={className}
      bodyClassName="gap-4"
    >
      {vendors.length === 0 ? (
        <EmptyNote title={m.emptyTitle} action={emptyAction} icon={StorefrontIcon}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <>
          <Figures
            currency={currency}
            locale={locale}
            items={[
              { label: m.owed, amount: totals.owed, note: m.owedNote(owing) },
              {
                label: m.overdue,
                amount: totals.overdue,
                note:
                  totals.overdueVendors === 0
                    ? m.nothingOverdue
                    : m.overdueNote(totals.overdueVendors),
                ...(totals.overdueVendors > 0 ? { emphasis: 'negative' as const } : {}),
              },
              {
                label: m.dueSoon(horizonDays),
                amount: totals.dueSoon,
                note:
                  totals.dueSoonVendors === 0
                    ? m.nothingDueSoon
                    : m.dueSoonNote(totals.dueSoonVendors),
              },
            ]}
          />

          <div className="flex flex-wrap items-end gap-3">
            <Field className="w-full @xl:w-72">
              <FieldLabel>{m.searchLabel}</FieldLabel>
              <span className="relative flex items-center">
                <MagnifyingGlassIcon
                  aria-hidden
                  weight="bold"
                  className="pointer-events-none absolute start-3 size-4 text-fg-subtle"
                />
                <Input
                  type="search"
                  value={query}
                  autoComplete="off"
                  placeholder={m.searchPlaceholder}
                  onChange={(event) => {
                    setQuery(event.target.value);
                  }}
                  className="ps-9"
                />
              </span>
            </Field>
            <Segmented
              label={m.filterLabel}
              value={filter}
              onValueChange={setFilter}
              options={VENDOR_FILTERS.map((value) => ({
                value,
                label: m.filters[value],
                hint: counts[value],
              }))}
            />
            <DataTableSort
              table={table}
              label={m.sortBy}
              placeholder={m.sortPlaceholder}
              descendingLabel={m.descending}
              className="w-full @xl:hidden"
            />
          </div>

          <DataTable caption={m.tableCaption(m.filters[filter], currency)} hideCaption>
            {/* On a narrow block the Sort by control above sorts; the header stays for screen readers. */}
            <DataTableHeader table={table} className="@max-xl:sr-only" />
            <DataTableBody
              table={table}
              // Archived suppliers recede, still readable, so the live ones lead the eye.
              rowProps={(row) =>
                row.original.vendor.status === 'archived'
                  ? { 'data-archived': '', className: '*:text-fg-muted' }
                  : {}
              }
              empty={
                <span className="flex flex-col items-center gap-3">
                  <span role="status" className="flex flex-col items-center gap-1">
                    <span className="font-medium text-fg">
                      {query.trim() !== ''
                        ? m.noResults(query.trim())
                        : m.noneInFilter(m.filters[filter])}
                    </span>
                    <span>{m.noResultsNote}</span>
                  </span>
                  {filtered && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setQuery('');
                        setFilter('all');
                      }}
                    >
                      {m.clearSearch}
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

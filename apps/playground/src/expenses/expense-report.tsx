import { ArrowLeftIcon, TrashIcon } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  DataTable,
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
  DateRangePicker,
  Money,
  ThemeScope,
  ToastProvider,
  formatMoney,
  selectionColumn,
  useDataTable,
  useToast,
  type DataTableColumnDef,
  type DateRange,
  type DateRangePreset,
} from '@rectio/ui';
import { useEffect, useState } from 'react';

import type { Mode, ThemeId } from '../themes';
import { AddExpenseDialog } from './add-expense-dialog';
import { EXPENSES, STATUSES, categoryLabel, type Expense } from './data';

const CURRENCY = 'EUR';
const LOCALE = 'en-IE';
/** A toast with an Undo stays long enough to reach the button from the keyboard. */
const UNDO_MS = 8000;
const MARCH = { from: new Date(2026, 2, 1), to: new Date(2026, 2, 31) };
/** The report covers March 2026; the presets are fixed so the demo never drifts with the clock. */
const PRESETS: DateRangePreset[] = [
  { label: 'March', range: MARCH },
  {
    label: 'First half of March',
    range: { from: new Date(2026, 2, 1), to: new Date(2026, 2, 15) },
  },
  { label: 'February', range: { from: new Date(2026, 1, 1), to: new Date(2026, 1, 28) } },
  { label: 'Quarter to date', range: { from: new Date(2026, 0, 1), to: new Date(2026, 2, 31) } },
];

const shortDate = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });
const money = (amount: number) => formatMoney(amount, CURRENCY, { locale: LOCALE });
const sum = (list: { amount: number }[]) => list.reduce((total, e) => total + e.amount, 0);
/** Rejected lines stay on the report for the record but are never paid, so they leave the total. */
const claimed = (list: Expense[]) => list.filter((e) => e.status !== 'rejected');
const footRows = (rows: { original: Expense }[]) => rows.map((row) => row.original);

const inPeriod = (date: Date, period: DateRange | undefined) =>
  period?.from === undefined || (date >= period.from && date <= (period.to ?? period.from));

function StatusBadge({ status }: { status: Expense['status'] }) {
  const { label, tone } = STATUSES[status];
  return <Badge tone={tone}>{label}</Badge>;
}

/** On phones Date, Category and Status fold under the merchant, so the amount never leaves the screen. */
const WIDE = 'hidden sm:table-cell';

const columns: DataTableColumnDef<Expense>[] = [
  selectionColumn<Expense>({
    rowLabel: (row) => `Select ${row.original.merchant}, ${shortDate.format(row.original.date)}`,
    allLabel: 'Select all expenses',
  }),
  {
    accessorKey: 'date',
    header: 'Date',
    sortFn: 'datetime',
    meta: { className: `${WIDE} w-20 whitespace-nowrap` },
    cell: ({ row }) => (
      <span className="text-fg-muted numeric">{shortDate.format(row.original.date)}</span>
    ),
  },
  {
    accessorKey: 'merchant',
    header: 'Merchant',
    sortFn: 'text',
    cell: ({ row }) => {
      const e = row.original;
      return (
        <>
          <span className="block">{e.merchant}</span>
          <span className="block text-sm text-fg-muted sm:hidden">
            <span className="numeric">{shortDate.format(e.date)}</span>, {categoryLabel(e.category)}
          </span>
          {e.note !== undefined && <span className="block text-sm text-fg-subtle">{e.note}</span>}
        </>
      );
    },
    footer: ({ table }) => {
      const all = footRows(table.getRowModel().rows);
      const counted = claimed(all);
      const rejected = all.length - counted.length;
      return (
        <span className="flex flex-col text-sm">
          <span className="font-medium whitespace-nowrap text-fg">
            Total claimed, {counted.length} expenses
          </span>
          {rejected > 0 && (
            <span className="text-fg-muted">
              {rejected} rejected,{' '}
              <Money amount={sum(all) - sum(counted)} currency={CURRENCY} locale={LOCALE} /> not
              counted
            </span>
          )}
        </span>
      );
    },
  },
  {
    id: 'category',
    accessorFn: (e) => categoryLabel(e.category),
    header: 'Category',
    sortFn: 'text',
    meta: { className: WIDE },
    cell: ({ getValue }) => <span className="text-fg-muted">{String(getValue())}</span>,
  },
  {
    id: 'status',
    accessorFn: (e) => STATUSES[e.status].label,
    header: 'Status',
    sortFn: 'text',
    meta: { className: WIDE },
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'amount',
    header: `Amount, ${CURRENCY}`,
    meta: { align: 'end', label: 'Amount' },
    cell: ({ row }) => (
      <>
        <Money
          amount={row.original.amount}
          currency={CURRENCY}
          locale={LOCALE}
          tone={row.original.amount < 0 ? 'auto' : 'neutral'}
          // Rejected lines stay for the record, struck and muted because the total leaves them out.
          className={row.original.status === 'rejected' ? 'text-fg-muted line-through' : undefined}
        />
        {/* On phones the state sits under its amount, so a row stays three lines at most. */}
        <span className="mt-1 block sm:hidden">
          <StatusBadge status={row.original.status} />
        </span>
      </>
    ),
    footer: ({ table }) => (
      <Money
        amount={sum(claimed(footRows(table.getRowModel().rows)))}
        currency={CURRENCY}
        locale={LOCALE}
        className="text-xl font-strong"
      />
    ),
  },
];

/** The finance composition: an expense report with the add expense dialog. */
export function ExpenseReport({ theme, mode }: { theme: ThemeId; mode: Mode }) {
  return (
    <ThemeScope theme={theme} mode={mode} className="min-h-dvh">
      <ToastProvider timeout={UNDO_MS}>
        <Report />
      </ToastProvider>
    </ThemeScope>
  );
}

function Report() {
  const toast = useToast();
  const [expenses, setExpenses] = useState<Expense[]>(EXPENSES);
  const [period, setPeriod] = useState<DateRange | undefined>(MARCH);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const visible = expenses.filter((e) => inPeriod(e.date, period));

  const table = useDataTable({
    data: visible,
    columns,
    getRowId: (e) => e.id,
  });
  const selected = table.getSelectedRowModel().rows.map((row) => row.original);

  useEffect(() => {
    if (lastAdded === null) return;
    document.querySelector(`[data-row="${lastAdded}"]`)?.scrollIntoView({
      block: 'nearest',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }, [lastAdded]);

  const add = (expense: Expense) => {
    setExpenses((list) => [...list, expense]);
    setLastAdded(expense.id);
    const id = toast.add({
      type: 'success',
      title: 'Expense added',
      description: `${expense.merchant}, ${money(expense.amount)}`,
      actionProps: {
        children: 'Undo',
        onClick: () => {
          setExpenses((list) => list.filter((e) => e.id !== expense.id));
          setLastAdded(null);
          toast.close(id);
        },
      },
    });
  };

  const remove = () => {
    const before = expenses;
    const removed = new Set(selected.map((e) => e.id));
    setExpenses(before.filter((e) => !removed.has(e.id)));
    table.resetRowSelection();
    const count = removed.size;
    // Speak in the total's terms: rejected lines were never counted, so they do not move it.
    const totalNow = sum(
      claimed(before.filter((e) => !removed.has(e.id) && inPeriod(e.date, period))),
    );
    const id = toast.add({
      type: 'success',
      title: count === 1 ? 'Expense removed' : `${String(count)} expenses removed`,
      description: `Total claimed is now ${money(totalNow)}.`,
      actionProps: {
        children: 'Undo',
        onClick: () => {
          // Back in place, in their original order.
          setExpenses(before);
          toast.close(id);
        },
      },
    });
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8">
      <a
        href="?"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-fg-muted underline decoration-line-strong underline-offset-4 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <ArrowLeftIcon aria-hidden weight="bold" className="size-3.5" />
        All components
      </a>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-fg-muted">Report 2041 · Anna Kowalska · In draft</p>
          <h1 className="font-display text-3xl font-heading tracking-tight">
            March travel and tools
          </h1>
        </div>
        <AddExpenseDialog onAdd={add} />
      </header>

      <section aria-label="Expenses" className="flex flex-col gap-3">
        {/* One toolbar row: the period on the left; actions for the selection on the right. */}
        <div className="flex min-h-(--rx-control-height-md) flex-wrap items-center justify-between gap-3">
          <DateRangePicker
            aria-label="Period"
            locale={LOCALE}
            value={period}
            onValueChange={setPeriod}
            presets={PRESETS}
          />
          {selected.length > 0 && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-fg-muted">
                {selected.length} selected,{' '}
                <Money amount={sum(claimed(selected))} currency={CURRENCY} locale={LOCALE} /> of the
                total
              </p>
              <Button variant="danger" size="sm" onClick={remove}>
                <TrashIcon aria-hidden weight="bold" className="size-3.5" />
                Remove
              </Button>
            </div>
          )}
        </div>

        <DataTable caption="Expenses in this report" hideCaption>
          <DataTableHeader table={table} sticky />
          <DataTableBody
            table={table}
            empty={
              <span className="flex flex-col items-center gap-3">
                <span className="flex flex-col items-center gap-1">
                  <span className="font-medium text-fg">No expenses in this period</span>
                  <span>Every line in this report is dated in March.</span>
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPeriod(MARCH);
                  }}
                >
                  Show all of March
                </Button>
              </span>
            }
            rowProps={(row) => ({
              'data-row': row.id,
              'data-new': row.id === lastAdded || undefined,
              className: 'data-new:not-data-selected:bg-surface-hover',
            })}
          />
          {visible.length > 0 && <DataTableFooter table={table} />}
        </DataTable>
      </section>
    </div>
  );
}

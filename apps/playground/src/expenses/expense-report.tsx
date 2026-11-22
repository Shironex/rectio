import { ArrowLeftIcon, TrashIcon } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  DataTable,
  DataTableFooter,
  DataTableHeader,
  DataTableSort,
  DateRangePicker,
  Money,
  ThemeScope,
  formatMoney,
  selectionColumn,
  useDataTable,
  useToast,
  type DataTableColumnDef,
  type DateRange,
  type DateRangePreset,
} from '@rectio/ui';
import { useEffect, useMemo, useState } from 'react';

import { usePageCanvas } from '../page-canvas';
import { readSkin, type Mode, type ThemeId } from '../themes';
import { AddExpenseDialog } from './add-expense-dialog';
import { EXPENSES, STATUSES, categoryLabel, type Expense } from './data';
import { KitProvider, MOTION_KIT, PLAIN_KIT, useKit, type Kit } from './kit';

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
  // The demo's today is 19 March, the date new lines default to.
  { label: 'Quarter to date', range: { from: new Date(2026, 0, 1), to: new Date(2026, 2, 19) } },
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

/** The columns, with the total drawn by the kit's Money: it counts to a new figure with motion on. */
function columnsWith(TotalMoney: Kit['Money']): DataTableColumnDef<Expense>[] {
  return [
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
              <span className="numeric">{shortDate.format(e.date)}</span>,{' '}
              {categoryLabel(e.category)}
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
            className={
              row.original.status === 'rejected' ? 'text-fg-muted line-through' : undefined
            }
          />
          {/* On phones the state sits under its amount, so a row stays three lines at most. */}
          <span className="mt-1 block sm:hidden">
            <StatusBadge status={row.original.status} />
          </span>
        </>
      ),
      footer: ({ table }) => (
        <TotalMoney
          amount={sum(claimed(footRows(table.getRowModel().rows)))}
          currency={CURRENCY}
          locale={LOCALE}
          className="text-xl font-strong"
        />
      ),
    },
  ];
}

/** The finance composition: an expense report with the add expense dialog. */
export function ExpenseReport({
  theme,
  mode,
  motion = false,
}: {
  theme: ThemeId;
  mode: Mode;
  /** Swap in the motion add-on's components: rows that arrive and leave, a total that counts. */
  motion?: boolean;
}) {
  // The motion kit's toasts arrive calmly and the stack glides; the plain ones fade in place.
  const { ToastProvider } = motion ? MOTION_KIT : PLAIN_KIT;
  const canvas = usePageCanvas(theme, mode);
  return (
    <ThemeScope
      ref={canvas}
      theme={theme}
      mode={mode}
      skin={readSkin(window.location.search)}
      className="min-h-dvh"
    >
      <KitProvider motion={motion}>
        <ToastProvider timeout={UNDO_MS}>
          <Report back={motion ? `?view=motion&theme=${theme}&mode=${mode}` : null} />
        </ToastProvider>
      </KitProvider>
    </ThemeScope>
  );
}

function Report({ back }: { back: string | null }) {
  const kit = useKit();
  const { DataTableBody } = kit;
  const columns = useMemo(() => columnsWith(kit.Money), [kit]);
  const toast = useToast();
  const [expenses, setExpenses] = useState<Expense[]>(EXPENSES);
  const [period, setPeriod] = useState<DateRange | undefined>(MARCH);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const visible = expenses.filter((e) => inPeriod(e.date, period));

  const table = useDataTable({
    data: visible,
    columns,
    getRowId: (e) => e.id,
    // Lines read in date order until someone sorts, and the Date header says so.
    initialState: { sorting: [{ id: 'date', desc: false }] },
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
    const totalNow = sum(claimed([...expenses, expense].filter((e) => inPeriod(e.date, period))));
    setExpenses((list) => [...list, expense]);
    setLastAdded(expense.id);
    const id = toast.add({
      type: 'success',
      title: 'Expense added',
      description: `${expense.merchant}, ${money(expense.amount)}. Total now ${money(totalNow)}.`,
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
      // A removal is news with an undo, not a success: the green check stays for saves.
      type: 'info',
      // One line is named, so two toasts in a row say which Undo brings back which expense.
      title:
        count === 1 && selected[0] !== undefined
          ? `${selected[0].merchant} removed`
          : `${String(count)} expenses removed`,
      description: `Total now ${money(totalNow)}.`,
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
        href={back ?? '?'}
        className="inline-flex min-h-6 w-fit items-center gap-1.5 text-sm text-fg-muted pointer-coarse:min-h-(--rx-control-height-touch) underline decoration-line-strong underline-offset-4 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <ArrowLeftIcon aria-hidden weight="bold" className="size-3.5" />
        {back === null ? 'All components' : 'Motion add-on'}
      </a>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-fg-muted">Report 2041 · Isla Fraser · In draft</p>
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
            className="w-full sm:w-auto"
          />
          {/* Phones fold Date, Category and Status away from the header; this sorts by any of them. */}
          <DataTableSort table={table} className="w-full sm:hidden" />
          {selected.length > 0 && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-fg-muted">
                {selected.length} selected,{' '}
                <Money amount={sum(claimed(selected))} currency={CURRENCY} locale={LOCALE} />
                <span>
                  {' '}
                  counted
                  {selected.length > claimed(selected).length &&
                    `, ${String(selected.length - claimed(selected).length)} rejected not counted`}
                </span>
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

'use client';

import { PlusIcon } from '@phosphor-icons/react';
import { Button, DataTableBody, Money } from '@rectio/motion';
import {
  Badge,
  DataTable,
  DataTableFooter,
  DataTableHeader,
  useDataTable,
  type DataTableColumnDef,
} from '@rectio/ui';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ARRIVING, CURRENCY, LINES, LOCALE, STATUS, sum, type Line } from './data';

/** Rejected lines stay for the record but leave the total. */
const claimed = (lines: Line[]) => lines.filter((l) => l.status !== 'rejected');
const INITIAL = new Set(LINES.map((l) => l.id));
const ROW_STEPS = ['site-step-2', 'site-step-3', 'site-step-4', 'site-step-5'];
/** How long after load the first line arrives by itself, if the visitor has not added one. */
const FIRST_ARRIVAL_MS = 2600;

const columns: DataTableColumnDef<Line>[] = [
  {
    accessorKey: 'merchant',
    header: 'Merchant',
    cell: ({ row }) => (
      <>
        <span className="block text-fg">{row.original.merchant}</span>
        <span className="block text-sm text-fg-subtle">{row.original.note}</span>
        <span className="mt-1.5 block sm:hidden">
          <Badge tone={STATUS[row.original.status].tone}>{STATUS[row.original.status].label}</Badge>
        </span>
      </>
    ),
    footer: ({ table }) => (
      <span className="text-sm font-medium whitespace-nowrap text-fg">
        Total claimed, {table.getRowModel().rows.length} lines
      </span>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ getValue }) => <span className="text-fg-muted">{String(getValue())}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { className: 'hidden sm:table-cell' },
    cell: ({ row }) => (
      <Badge tone={STATUS[row.original.status].tone}>{STATUS[row.original.status].label}</Badge>
    ),
  },
  {
    accessorKey: 'amount',
    header: `Amount, ${CURRENCY}`,
    meta: { align: 'end', label: 'Amount' },
    cell: ({ row }) => (
      <Money
        amount={row.original.amount}
        currency={CURRENCY}
        locale={LOCALE}
        tone={row.original.amount < 0 ? 'auto' : 'neutral'}
      />
    ),
    footer: ({ table }) => (
      <Money
        amount={sum(claimed(table.getRowModel().rows.map((r) => r.original)))}
        currency={CURRENCY}
        locale={LOCALE}
        className="text-xl font-strong"
      />
    ),
  },
];

/**
 * The hero's live expense report. Its first lines rise in on load (CSS, before any script); then a
 * new line arrives by itself and the total counts to its new figure. Add expense does the same on
 * demand. Built from the real components: plain table parts, motioned rows, total and button.
 */
export function HeroReport() {
  const [lines, setLines] = useState<Line[]>(LINES);
  const added = lines.length - LINES.length;
  const next = ARRIVING[added];
  const touched = useRef(false);

  const add = () => {
    if (next === undefined) return;
    setLines((current) => [...current, next]);
  };

  useEffect(() => {
    const id = setTimeout(() => {
      if (!touched.current) setLines((current) => [...current, ...ARRIVING.slice(0, 1)]);
    }, FIRST_ARRIVAL_MS);
    return () => {
      clearTimeout(id);
    };
  }, []);

  const table = useDataTable({ data: lines, columns, getRowId: (l) => l.id });
  const rowProps = useMemo(
    () => (row: { id: string; index: number }) => ({
      className: INITIAL.has(row.id)
        ? `site-enter ${ROW_STEPS[row.index] ?? 'site-step-5'}`
        : undefined,
    }),
    [],
  );

  return (
    <div className="site-enter site-step-1 flex flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-overlay">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-5 pt-5 pb-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-fg-muted">Report 2041, Anna Kowalska</p>
          <h2 className="font-display text-xl font-heading tracking-tight text-fg">
            March travel and tools
          </h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={next === undefined}
          onClick={() => {
            touched.current = true;
            add();
          }}
        >
          <PlusIcon aria-hidden weight="bold" className="size-3.5" />
          Add expense
        </Button>
      </div>
      <DataTable caption="Expenses in report 2041" hideCaption className="text-base">
        <DataTableHeader table={table} />
        <DataTableBody table={table} rowProps={rowProps} />
        <DataTableFooter table={table} />
      </DataTable>
    </div>
  );
}

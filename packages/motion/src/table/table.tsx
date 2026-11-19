import {
  DataTableBody as PlainDataTableBody,
  TableBody,
  TableCell,
  TableRow as PlainTableRow,
  type DataTableBodyProps,
  type DataTableColumnMeta,
} from '@rectio/ui';
import type { RowData } from '@tanstack/react-table';
import { AnimatePresence, PresenceContext, usePresence } from 'motion/react';
import { use, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react';

import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens, type MotionTokens } from '../lib/tokens';

/** The cell needs nothing of its own: rows move by transform, so a cell never clips or resizes. */
export { TableCell };

/**
 * Table rows that arrive and leave in place, moving only transform and opacity: the layout changes
 * once, in a single frame, and every row that it moved slides from where it was drawn to where it
 * now is (FLIP). A new row fades in as the rows below it slide down out of its way; a deleted row
 * fades out to the side, faster than an entry, and then the rows below slide up into the gap.
 * Rows present on the first render never animate.
 */
export function TableRows({ children }: { children?: ReactNode }) {
  return <AnimatePresence initial={false}>{children}</AnimatePresence>;
}

/** A Web Animations easing from the token, as the stylesheet writes it. */
function cssEasing(element: Element, name: keyof MotionTokens['easing']): string {
  return (
    getComputedStyle(element).getPropertyValue(`--rx-motion-easing-${name}`).trim() || 'linear'
  );
}

/** Slides a row from `delta` pixels away (drawn where it was) to its place. */
function slide(row: HTMLTableRowElement, delta: number, tokens: MotionTokens) {
  if (delta === 0) return;
  row.animate([{ transform: `translateY(${String(delta)}px)` }, { transform: 'none' }], {
    duration: tokens.duration.base * 1000,
    easing: cssEasing(row, 'standard'),
  });
}

interface Leaving {
  row: HTMLTableRowElement;
  done: () => void;
}

/**
 * Rows that arrive or finish leaving in the same frame move the others together, once: a batch is
 * collected per table body and settled in a microtask, still before the frame is painted.
 */
const arriving = new Map<HTMLTableSectionElement, HTMLTableRowElement[]>();
const leaving = new Map<HTMLTableSectionElement, Leaving[]>();

/** The rows after the new ones were drawn higher by the new rows' heights: slide them down. */
function openGaps(body: HTMLTableSectionElement, tokens: MotionTokens) {
  const added = new Set(arriving.get(body));
  arriving.delete(body);
  let above = 0;
  for (const row of body.rows) {
    if (added.has(row)) above += row.offsetHeight;
    else slide(row, -above, tokens);
  }
}

/** Measures the others, takes the leavers out of the layout, measures again, slides the moved. */
function closeGaps(body: HTMLTableSectionElement, tokens: MotionTokens) {
  const queue = leaving.get(body) ?? [];
  leaving.delete(body);
  const gone = new Set(queue.map((entry) => entry.row));
  const rest = [...body.rows].filter((row) => !gone.has(row));
  const before = rest.map((row) => row.offsetTop);
  for (const row of gone) row.style.display = 'none';
  rest.forEach((row, index) => {
    slide(row, (before[index] ?? 0) - row.offsetTop, tokens);
  });
  for (const entry of queue) entry.done();
}

function enqueue<T>(
  queues: Map<HTMLTableSectionElement, T[]>,
  body: HTMLTableSectionElement,
  entry: T,
  settle: () => void,
) {
  const queue = queues.get(body) ?? [];
  if (queue.length === 0) queueMicrotask(settle);
  queues.set(body, [...queue, entry]);
}

/** A row nobody can see changes at once: there is nothing to follow. */
function inView(row: HTMLElement) {
  const box = row.getBoundingClientRect();
  return box.bottom > 0 && box.top < window.innerHeight;
}

/** Same as the plain table row; enters and leaves in place inside `TableRows`. */
export function TableRow({ ref, ...props }: ComponentProps<'tr'>) {
  const plain = usePlainMotion();
  const [isPresent, safeToRemove] = usePresence();
  const presence = use(PresenceContext);
  const node = useRef<HTMLTableRowElement | null>(null);
  // Only rows added after the first render (or outside TableRows) skip the entrance.
  const settled = useRef(presence === null || presence.initial === false);

  useLayoutEffect(() => {
    const row = node.current;
    const body = row?.parentElement;
    const tokens = row === null || plain || !inView(row) ? null : readMotionTokens(row);
    if (row === null || tokens === null || !(body instanceof HTMLTableSectionElement)) {
      settled.current = true;
      if (!isPresent) safeToRemove();
      return;
    }
    const { duration } = tokens;

    if (isPresent) {
      if (settled.current) return;
      settled.current = true;
      // Fades in once the rows below have mostly cleared its place, from a short drop above it.
      row.animate(
        [
          { opacity: 0, transform: `translateY(calc(-1 * ${tokens.distance.shift}))` },
          { opacity: 1, transform: 'none' },
        ],
        {
          duration: duration.base * 1000,
          delay: duration.fast * 500,
          easing: cssEasing(row, 'enter'),
          fill: 'backwards',
        },
      );
      enqueue(arriving, body, row, () => {
        openGaps(body, tokens);
      });
      return;
    }

    // Leaving: out of the tab order at once, then a quick fade to the side, faster than an entry.
    row.inert = true;
    const exit = row.animate(
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: `translateX(${tokens.distance.shift})` },
      ],
      { duration: duration.fast * 1000, easing: cssEasing(row, 'exit'), fill: 'forwards' },
    );
    void exit.finished.then(() => {
      enqueue(leaving, body, { row, done: safeToRemove }, () => {
        closeGaps(body, tokens);
      });
    });
  }, [isPresent, plain, safeToRemove]);

  return (
    <PlainTableRow
      ref={(value: HTMLTableRowElement | null) => {
        node.current = value;
        assignRef(ref, value);
      }}
      data-motion={plain ? undefined : ''}
      {...props}
    />
  );
}

const metaOf = (column: { columnDef: { meta?: unknown } }) =>
  (column.columnDef.meta ?? {}) as DataTableColumnMeta;

/**
 * Same props as the plain DataTableBody. Rows added after the first render fade in as the rows
 * below make way, and removed rows fade out before the gap closes; loading and empty states are
 * the plain ones. Under reduced motion it is the plain body.
 */
export function DataTableBody<TData extends RowData>(props: DataTableBodyProps<TData>) {
  const plain = usePlainMotion();
  const { table, loading = false, rowProps } = props;
  const rows = table.getRowModel().rows;
  if (plain || loading || rows.length === 0) return <PlainDataTableBody {...props} />;
  return (
    <TableBody>
      <TableRows>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            data-selected={row.getIsSelected() || undefined}
            {...rowProps?.(row)}
          >
            {row.getAllCells().map((cell) => {
              const meta = metaOf(cell.column);
              return (
                <TableCell key={cell.id} align={meta.align} className={meta.className}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableRows>
    </TableBody>
  );
}

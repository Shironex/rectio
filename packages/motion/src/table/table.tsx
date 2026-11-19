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
 * Table rows that arrive and leave in place, moving only transform and opacity. A new row takes its
 * place at once and fades in as the rows below it (the footer too) slide down out of its way from
 * where they were drawn (FLIP). A deleted row fades out to the side, faster than an entry, keeping
 * its space; halfway through the fade the rows below (and the content after the table) start to
 * slide up over the gap, and the row leaves the layout in the frame that slide ends, so nothing is
 * ever drawn on top of the total. Rows present on the first render never animate.
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

/** Moves a row (or what follows the table) vertically between two offsets, in pixels. */
function slide(
  row: HTMLElement,
  from: number,
  to: number,
  tokens: MotionTokens,
  delay = 0,
): Animation {
  return row.animate(
    [{ transform: `translateY(${String(from)}px)` }, { transform: `translateY(${String(to)}px)` }],
    {
      duration: tokens.duration.base * 1000,
      delay,
      easing: cssEasing(row, 'standard'),
      fill: 'both',
    },
  );
}

/** The rows a change in the body moves: the body's own, then the footer's. */
function followers(body: HTMLTableSectionElement): HTMLTableRowElement[] {
  const table = body.parentElement;
  const footer = table instanceof HTMLTableElement ? table.tFoot : null;
  return [...body.rows, ...(footer?.rows ?? [])];
}

/** How many levels above the table its following content is moved with it. */
const BELOW_LEVELS = 3;
/** The largest subtree moved with the table; anything bigger stays put and settles at the end. */
const BELOW_MAX_NODES = 400;

const inFlow = (style: CSSStyleDeclaration) =>
  style.position === 'static' || style.position === 'relative';

/**
 * True when moving the element by a transform would keep everything inside it where it is drawn.
 * A transform makes an element the containing block of its fixed descendants, so a portal holding
 * toasts or popups would jump with it: such a subtree, or one too big to check, is left alone.
 */
function safeToMove(element: HTMLElement): boolean {
  const all = element.getElementsByTagName('*');
  if (all.length > BELOW_MAX_NODES) return false;
  for (const child of all) {
    const position = getComputedStyle(child).position;
    if (position === 'fixed' || position === 'sticky') return false;
  }
  return true;
}

/**
 * What follows the table on the page and moves when it grows or shrinks: the next siblings of the
 * table and of a few of its ancestors, up to a scroll container. Only content in the flow, and
 * never a subtree with fixed or sticky content.
 */
function below(body: HTMLTableSectionElement): HTMLElement[] {
  const found: HTMLElement[] = [];
  let level: Element | null = body.closest('table');
  for (
    let depth = 0;
    level !== null && level !== document.body && depth <= BELOW_LEVELS;
    depth += 1
  ) {
    for (let next = level.nextElementSibling; next !== null; next = next.nextElementSibling) {
      if (!(next instanceof HTMLElement)) continue;
      const style = getComputedStyle(next);
      if (style.display !== 'none' && inFlow(style) && safeToMove(next)) found.push(next);
    }
    const parent: Element | null = level.parentElement;
    if (parent === null || /auto|scroll/.test(getComputedStyle(parent).overflowY)) break;
    level = parent;
  }
  return found;
}

interface Leaving {
  row: HTMLTableRowElement;
  /** The row's fade to the side. */
  fade: Animation;
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
  for (const row of followers(body)) {
    if (added.has(row)) above += row.offsetHeight;
    else if (above > 0) slide(row, -above, 0, tokens).finished.then(cancel, ignore);
  }
  if (above === 0) return;
  for (const element of below(body))
    slide(element, -above, 0, tokens).finished.then(cancel, ignore);
}

/**
 * The rows after the faded ones (and the content after the table) slide up by the faded rows'
 * heights while the layout stays; when
 * the slide ends, the faded rows leave the layout and the slides are dropped in the same frame, so
 * every row is already drawn where the new layout puts it.
 */
function closeGaps(body: HTMLTableSectionElement, tokens: MotionTokens) {
  const queue = leaving.get(body) ?? [];
  leaving.delete(body);
  const gone = new Set(queue.map((entry) => entry.row));
  const slides: Animation[] = [];
  // The gap starts closing halfway through the fade, so no empty row is left standing.
  const delay = tokens.duration.fast * 500;
  let above = 0;
  for (const row of followers(body)) {
    if (gone.has(row)) above += row.offsetHeight;
    else if (above > 0) slides.push(slide(row, 0, -above, tokens, delay));
  }
  // What follows the table moves up with the rows, so it is never left behind for the last frame.
  if (above > 0)
    for (const element of below(body)) slides.push(slide(element, 0, -above, tokens, delay));
  const finish = () => {
    for (const row of gone) row.style.display = 'none';
    for (const animation of slides) animation.cancel();
    for (const entry of queue) entry.done();
  };
  const moving = [...slides, ...queue.map((entry) => entry.fade)];
  void Promise.all(moving.map((animation) => animation.finished)).then(finish, finish);
}

/** A finished slide is dropped: its end is where the layout already draws the row. */
const cancel = (animation: Animation) => {
  animation.cancel();
};
const ignore = () => undefined;

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
  // The exit runs once: a re-render while the row leaves must not restart its fade.
  const exiting = useRef(false);

  useLayoutEffect(() => {
    const row = node.current;
    const body = row?.parentElement;
    const tokens = row === null || plain || !inView(row) ? null : readMotionTokens(row);
    if (row === null || tokens === null || !(body instanceof HTMLTableSectionElement)) {
      settled.current = true;
      // After the commit, not in this layout effect: AnimatePresence registers the leaving row in
      // its own layout effect, which runs after this child's, and ignores an earlier completion.
      if (!isPresent) queueMicrotask(safeToRemove);
      return;
    }
    const { duration } = tokens;

    if (isPresent) {
      exiting.current = false;
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
    // From the frame on screen: a row removed while it still arrives fades on from there.
    if (exiting.current) return;
    exiting.current = true;
    row.inert = true;
    const now = getComputedStyle(row);
    for (const animation of row.getAnimations()) animation.cancel();
    const exit = row.animate(
      [
        { opacity: now.opacity, transform: now.transform },
        { opacity: 0, transform: `translateX(${tokens.distance.shift})` },
      ],
      { duration: duration.fast * 1000, easing: cssEasing(row, 'exit'), fill: 'forwards' },
    );
    enqueue(leaving, body, { row, fade: exit, done: safeToRemove }, () => {
      closeGaps(body, tokens);
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

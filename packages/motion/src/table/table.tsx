import {
  DataTableBody as PlainDataTableBody,
  TableBody,
  TableCell as PlainTableCell,
  TableRow as PlainTableRow,
  type DataTableBodyProps,
  type DataTableColumnMeta,
  type TableCellProps,
} from '@rectio/ui';
import type { RowData } from '@tanstack/react-table';
import { AnimatePresence, PresenceContext, usePresence } from 'motion/react';
import { use, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react';

import { tweenTo } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

/**
 * Table rows that arrive and leave in place: a new row opens its height and fades in, a deleted
 * row fades out first and then closes the gap, so the rows below slide up instead of jumping.
 * Rows present on the first render never animate.
 *
 * Height cannot animate on a table row, so each cell opens and closes itself (its height and
 * vertical padding) while a block inside it clips the content.
 */
export function TableRows({ children }: { children?: ReactNode }) {
  return <AnimatePresence initial={false}>{children}</AnimatePresence>;
}

interface CellParts {
  cell: HTMLElement;
  content: HTMLElement;
  height: string;
  paddingTop: string;
  paddingBottom: string;
  contentHeight: string;
}

function cellParts(row: HTMLTableRowElement): CellParts[] {
  return [...row.cells].flatMap((cell) => {
    const content = cell.firstElementChild;
    if (!(content instanceof HTMLElement) || content.dataset.part !== 'cell') return [];
    const style = getComputedStyle(cell);
    return [
      {
        cell,
        content,
        height: `${String(cell.getBoundingClientRect().height)}px`,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        contentHeight: `${String(content.offsetHeight)}px`,
      },
    ];
  });
}

const CLOSED = { height: '0px', paddingTop: '0px', paddingBottom: '0px' };

/** Clips the contents while they open or close; focus rings must not be clipped at rest. */
function clip(parts: CellParts[], on: boolean) {
  for (const { content } of parts) content.style.overflow = on ? 'hidden' : '';
}

/**
 * Height is a layout property: each frame lays the table out again. That is cheap for the row in
 * view and pointless for one nobody can see, so a row outside the viewport changes at once.
 */
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
    const tokens = row === null || plain || !inView(row) ? null : readMotionTokens(row);
    if (row === null || tokens === null) {
      settled.current = true;
      if (!isPresent) safeToRemove();
      return;
    }
    const parts = cellParts(row);
    const { duration, easing } = tokens;

    if (isPresent) {
      if (settled.current) return;
      settled.current = true;
      clip(parts, true);
      const opening = parts.flatMap((p) => [
        tweenTo(
          p.cell,
          {
            height: ['0px', p.height],
            paddingTop: ['0px', p.paddingTop],
            paddingBottom: ['0px', p.paddingBottom],
          },
          duration.base,
          easing.enter,
        ),
        tweenTo(p.content, { height: ['0px', p.contentHeight] }, duration.base, easing.enter),
      ]);
      tweenTo(row, { opacity: [0, 1] }, duration.base, easing.enter, duration.fast);
      void Promise.all(opening).then(() => {
        clip(parts, false);
      });
      return;
    }

    // Leaving: out of the tab order at once, then fade, then close the gap.
    row.inert = true;
    clip(parts, true);
    // The end state, under the animations: no full-height frame between their end and removal.
    row.style.opacity = '0';
    for (const p of parts) {
      Object.assign(p.cell.style, CLOSED);
      p.content.style.height = '0px';
    }
    const fade = tweenTo(row, { opacity: [1, 0] }, duration.fast, easing.exit);
    const closing = parts.flatMap((p) => [
      tweenTo(
        p.cell,
        {
          height: [p.height, '0px'],
          paddingTop: [p.paddingTop, '0px'],
          paddingBottom: [p.paddingBottom, '0px'],
        },
        duration.base,
        easing.standard,
        duration.fast,
      ),
      tweenTo(
        p.content,
        { height: [p.contentHeight, '0px'] },
        duration.base,
        easing.standard,
        duration.fast,
      ),
    ]);
    void Promise.all([fade, ...closing]).then(() => {
      safeToRemove();
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

/** Same as the plain table cell, with the block inside that opens and closes with its row. */
export function TableCell({ children, ...props }: TableCellProps) {
  return (
    <PlainTableCell {...props}>
      <div data-part="cell">{children}</div>
    </PlainTableCell>
  );
}

const metaOf = (column: { columnDef: { meta?: unknown } }) =>
  (column.columnDef.meta ?? {}) as DataTableColumnMeta;

/**
 * Same props as the plain DataTableBody. Rows added after the first render open in place and
 * removed rows fade and close the gap; loading and empty states are the plain ones. Under reduced
 * motion it is the plain body.
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

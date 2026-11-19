import { cn } from '@rectio/ui';
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
 * Height cannot animate on a table row, so each cell holds its content in a block that does:
 * put a cell's padding on `contentClassName`, not on `className`.
 */
export function TableRows({ children }: { children?: ReactNode }) {
  return <AnimatePresence initial={false}>{children}</AnimatePresence>;
}

const cellContents = (row: HTMLTableRowElement) =>
  [...row.cells]
    .map((cell) => cell.firstElementChild)
    .filter((el): el is HTMLElement => el instanceof HTMLElement && el.dataset.part === 'cell');

/** Clips the contents while they open or close; focus rings must not be clipped at rest. */
function clip(cells: HTMLElement[], on: boolean) {
  for (const cell of cells) cell.style.overflow = on ? 'hidden' : '';
}

export function TableRow({ ref, ...props }: ComponentProps<'tr'>) {
  const plain = usePlainMotion();
  const [isPresent, safeToRemove] = usePresence();
  const presence = use(PresenceContext);
  const node = useRef<HTMLTableRowElement | null>(null);
  // Only rows added after the first render (or outside TableRows) skip the entrance.
  const settled = useRef(presence === null || presence.initial === false);

  useLayoutEffect(() => {
    const row = node.current;
    const tokens = row === null || plain ? null : readMotionTokens(row);
    if (row === null || tokens === null) {
      settled.current = true;
      if (!isPresent) safeToRemove();
      return;
    }
    const cells = cellContents(row);
    const { duration, easing } = tokens;

    if (isPresent) {
      if (settled.current) return;
      settled.current = true;
      clip(cells, true);
      const opening = cells.map((cell) =>
        tweenTo(
          cell,
          { height: ['0px', `${String(cell.offsetHeight)}px`] },
          duration.base,
          easing.enter,
        ),
      );
      tweenTo(row, { opacity: [0, 1] }, duration.base, easing.enter, duration.fast);
      void Promise.all(opening).then(() => {
        clip(cells, false);
      });
      return;
    }

    // Leaving: out of the tab order at once, then fade, then close the gap.
    row.inert = true;
    clip(cells, true);
    const heights = cells.map((cell) => `${String(cell.offsetHeight)}px`);
    // The end state, under the animations: no full-height frame between their end and removal.
    row.style.opacity = '0';
    for (const cell of cells) cell.style.height = '0px';
    const fade = tweenTo(row, { opacity: [1, 0] }, duration.fast, easing.exit);
    const closing = cells.map((cell, index) =>
      tweenTo(
        cell,
        { height: [heights[index] ?? '0px', '0px'] },
        duration.base,
        easing.standard,
        duration.fast,
      ),
    );
    void Promise.all([fade, ...closing]).then(() => {
      safeToRemove();
    });
  }, [isPresent, plain, safeToRemove]);

  return (
    <tr
      ref={(value) => {
        node.current = value;
        assignRef(ref, value);
      }}
      data-motion={plain ? undefined : ''}
      {...props}
    />
  );
}

export interface TableCellProps extends ComponentProps<'td'> {
  /** Classes for the block inside the cell, which opens and closes: padding goes here. */
  contentClassName?: string;
}

export function TableCell({ contentClassName, children, ...props }: TableCellProps) {
  return (
    <td {...props}>
      <div data-part="cell" className={cn(contentClassName)}>
        {children}
      </div>
    </td>
  );
}

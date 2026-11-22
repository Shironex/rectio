/** What the shortcut does, given where the panel and the focus are. */
export type AssistantShortcutAction = 'open' | 'focus' | 'close';

/**
 * The shortcut opens a closed panel; on an open panel it brings the focus in from the page, and
 * from inside the panel it closes it again, so one key moves the reader both ways.
 */
export function shortcutAction(open: boolean, focusInside: boolean): AssistantShortcutAction {
  if (!open) return 'open';
  return focusInside ? 'close' : 'focus';
}

export interface AssistantSizes {
  defaultSize: number;
  minSize: number;
  maxSize: number;
}

/**
 * The panel's sizes in percent of the row, made consistent: each a number from 10 to 80, the
 * smallest no larger than the largest and the default between them. The app content keeps the
 * rest, so it never shrinks below a fifth of the row.
 */
export function assistantSizes(
  defaultSize: number,
  minSize: number,
  maxSize: number,
): AssistantSizes {
  const clamp = (value: number, fallback: number) =>
    Number.isFinite(value) ? Math.min(80, Math.max(10, value)) : fallback;
  const min = clamp(minSize, 22);
  const max = Math.max(min, clamp(maxSize, 50));
  return {
    minSize: min,
    maxSize: max,
    defaultSize: Math.min(max, Math.max(min, clamp(defaultSize, 32))),
  };
}

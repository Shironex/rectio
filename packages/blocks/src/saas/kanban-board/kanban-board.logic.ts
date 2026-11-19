export interface KanbanColumn {
  id: string;
  title: string;
  /** Work-in-progress limit: the column warns, in words, once it holds more. */
  limit?: number;
}

export interface KanbanAssignee {
  name: string;
  avatarUrl?: string;
}

export type KanbanPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface KanbanCard {
  id: string;
  columnId: string;
  title: string;
  /** A short reference shown above the title, such as FER-218. */
  reference?: string;
  tags?: readonly string[];
  assignee?: KanbanAssignee;
  due?: Date;
  priority?: KanbanPriority;
}

/** Where a card goes: a column and its position among that column's cards, counted from 0. */
export interface KanbanPosition {
  columnId: string;
  index: number;
}

/** A column's cards in board order (the order of the `cards` array). */
export function kanbanColumnCards(cards: readonly KanbanCard[], columnId: string): KanbanCard[] {
  return cards.filter((card) => card.columnId === columnId);
}

/** Where a card sits now, or null when it is not on the board. */
export function kanbanPositionOf(
  cards: readonly KanbanCard[],
  cardId: string,
): KanbanPosition | null {
  const card = cards.find((c) => c.id === cardId);
  if (card === undefined) return null;
  return {
    columnId: card.columnId,
    index: kanbanColumnCards(cards, card.columnId).findIndex((c) => c.id === cardId),
  };
}

/**
 * The board after moving one card: it leaves its place and lands at `index` among the target
 * column's other cards (clamped to the column). Returns a new array; the input is left as it was.
 */
export function moveKanbanCard(
  cards: readonly KanbanCard[],
  cardId: string,
  toColumnId: string,
  index: number,
): KanbanCard[] {
  const card = cards.find((c) => c.id === cardId);
  if (card === undefined) return [...cards];
  const rest = cards.filter((c) => c.id !== cardId);
  const target = rest.filter((c) => c.columnId === toColumnId);
  const at = Math.max(0, Math.min(index, target.length));
  const moved = { ...card, columnId: toColumnId };
  // Insert before the card that will follow it, or after the column's last card.
  const before = target[at];
  const last = target.at(-1);
  const anchor =
    before !== undefined
      ? rest.indexOf(before)
      : last !== undefined
        ? rest.indexOf(last) + 1
        : rest.length;
  return [...rest.slice(0, anchor), moved, ...rest.slice(anchor)];
}

export type KanbanDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Where a keyboard move sends a card: up and down within its column, left and right to the same
 * position in the next column (or its end). Null at an edge, where nothing moves.
 */
export function kanbanStep(
  cards: readonly KanbanCard[],
  columns: readonly KanbanColumn[],
  cardId: string,
  direction: KanbanDirection,
): KanbanPosition | null {
  const from = kanbanPositionOf(cards, cardId);
  if (from === null) return null;
  const size = kanbanColumnCards(cards, from.columnId).length;
  if (direction === 'up') return from.index === 0 ? null : { ...from, index: from.index - 1 };
  if (direction === 'down') {
    return from.index >= size - 1 ? null : { ...from, index: from.index + 1 };
  }
  const columnIndex = columns.findIndex((column) => column.id === from.columnId);
  const next = columns[columnIndex + (direction === 'left' ? -1 : 1)];
  if (columnIndex === -1 || next === undefined) return null;
  const nextSize = kanbanColumnCards(cards, next.id).length;
  return { columnId: next.id, index: Math.min(from.index, nextSize) };
}

/** True when a column holds more cards than its limit allows. */
export function kanbanOverLimit(column: KanbanColumn, count: number): boolean {
  return column.limit !== undefined && count > column.limit;
}

export type KanbanDueState = 'overdue' | 'today' | 'soon' | 'later';

/** How near a due date is: past, today, within three days, or later. */
export function kanbanDueState(due: Date, today: Date): KanbanDueState {
  const day = (date: Date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
  const days = day(due) - day(today);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 3) return 'soon';
  return 'later';
}

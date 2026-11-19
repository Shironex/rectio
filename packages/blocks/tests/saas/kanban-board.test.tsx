import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  KanbanBoard,
  kanbanDueState,
  kanbanOverLimit,
  kanbanPositionOf,
  kanbanStep,
  moveKanbanCard,
  type KanbanCard,
  type KanbanColumn,
} from '../../src/index';

const COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'Doing', limit: 1 },
  { id: 'done', title: 'Done' },
];
const CARDS: KanbanCard[] = [
  { id: 'a', columnId: 'todo', title: 'Alpha' },
  { id: 'b', columnId: 'todo', title: 'Bravo' },
  { id: 'c', columnId: 'doing', title: 'Charlie' },
  { id: 'd', columnId: 'done', title: 'Delta' },
];
const ids = (cards: KanbanCard[], column: string) =>
  cards.filter((c) => c.columnId === column).map((c) => c.id);

describe('kanban logic', () => {
  it('moves a card to a place among the target column', () => {
    const moved = moveKanbanCard(CARDS, 'a', 'doing', 0);
    expect(ids(moved, 'doing')).toEqual(['a', 'c']);
    expect(ids(moved, 'todo')).toEqual(['b']);
    expect(ids(moveKanbanCard(CARDS, 'a', 'done', 9), 'done')).toEqual(['d', 'a']);
    expect(ids(moveKanbanCard(CARDS, 'a', 'todo', 1), 'todo')).toEqual(['b', 'a']);
    expect(CARDS[0]?.columnId).toBe('todo');
  });

  it('steps a card by direction and stops at the edges', () => {
    expect(kanbanStep(CARDS, COLUMNS, 'a', 'up')).toBeNull();
    expect(kanbanStep(CARDS, COLUMNS, 'a', 'down')).toEqual({ columnId: 'todo', index: 1 });
    expect(kanbanStep(CARDS, COLUMNS, 'b', 'right')).toEqual({ columnId: 'doing', index: 1 });
    expect(kanbanStep(CARDS, COLUMNS, 'a', 'left')).toBeNull();
    expect(kanbanStep(CARDS, COLUMNS, 'd', 'right')).toBeNull();
    expect(kanbanPositionOf(CARDS, 'b')).toEqual({ columnId: 'todo', index: 1 });
  });

  it('knows limits and due dates', () => {
    expect(kanbanOverLimit({ id: 'doing', title: 'Doing', limit: 1 }, 2)).toBe(true);
    expect(kanbanOverLimit({ id: 'todo', title: 'To do' }, 99)).toBe(false);
    const today = new Date(2026, 2, 19, 15);
    expect(kanbanDueState(new Date(2026, 2, 18), today)).toBe('overdue');
    expect(kanbanDueState(new Date(2026, 2, 19, 9), today)).toBe('today');
    expect(kanbanDueState(new Date(2026, 2, 21), today)).toBe('soon');
    expect(kanbanDueState(new Date(2026, 3, 1), today)).toBe('later');
  });
});

function Board({ onMove }: { onMove?: (id: string, column: string, index: number) => void }) {
  const [cards, setCards] = useState(CARDS);
  return (
    <KanbanBoard
      columns={COLUMNS}
      cards={cards}
      onMoveCard={(id, column, index) => {
        onMove?.(id, column, index);
        setCards(moveKanbanCard(cards, id, column, index));
      }}
    />
  );
}

describe('KanbanBoard', () => {
  it('moves a focused card with Alt and an arrow key, keeps focus and reads it out', async () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    screen.getByRole('article', { name: 'Bravo' }).focus();
    await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(onMove).toHaveBeenCalledWith('b', 'doing', 1);
    expect(screen.getByRole('status')).toHaveTextContent('Bravo moved to Doing, position 2 of 2.');
    expect(screen.getByRole('article', { name: 'Bravo' })).toHaveFocus();
  });

  it('says when a card cannot move further', async () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    screen.getByRole('article', { name: 'Alpha' }).focus();
    await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
    expect(onMove).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Alpha cannot move further up.');
  });

  it('moves a card from its Move menu', async () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Move Alpha' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Move to Done' }));
    expect(onMove).toHaveBeenCalledWith('a', 'done', 1);
  });

  it('warns in words when a column is over its limit', async () => {
    render(<Board />);
    screen.getByRole('article', { name: 'Alpha' }).focus();
    await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(screen.getByText(/Over the limit of 1/)).toBeInTheDocument();
  });

  it('drops a dragged card at the end of a column', () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    const title = screen.getByText('Alpha');
    const alpha = title.closest('article') ?? title;
    const done = screen.getByRole('region', { name: 'Done' });
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' };
    fireEvent.dragStart(alpha, { dataTransfer });
    fireEvent.dragOver(done, { dataTransfer });
    fireEvent.drop(done, { dataTransfer });
    expect(onMove).toHaveBeenCalledWith('a', 'done', 1);
  });

  it('reads the same words out again on a repeated move', async () => {
    render(<Board />);
    screen.getByRole('article', { name: 'Alpha' }).focus();
    await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
    const first = screen.getByRole('status').textContent;
    await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
    expect(screen.getByRole('status').textContent).not.toBe(first);
  });

  it('shows ghost columns with one way in on an empty board', async () => {
    const onAddCard = vi.fn();
    render(<KanbanBoard columns={COLUMNS} cards={[]} onAddCard={onAddCard} />);
    expect(screen.getByText('The board is clear')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add a card' }));
    expect(onAddCard).toHaveBeenCalledWith('todo');
  });

  it('says what each ghost column is for and marks the column in view', () => {
    render(<KanbanBoard columns={COLUMNS} cards={[]} />);
    expect(screen.getByText('Cards land here when work starts')).toBeInTheDocument();
    const tabs = within(screen.getByRole('group', { name: 'Columns' })).getAllByRole('button');
    expect(tabs[0]).toHaveAttribute('aria-current', 'true');
    expect(tabs[1]).not.toHaveAttribute('aria-current');
  });

  it('shows an empty state without columns', () => {
    render(<KanbanBoard columns={[]} cards={[]} />);
    expect(screen.getByText('Set up your stages')).toBeInTheDocument();
  });
});

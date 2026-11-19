'use client';

import {
  KanbanBoard,
  type KanbanBoardProps,
  type KanbanCard,
  type KanbanColumn,
  moveKanbanCard,
} from '@rectio/blocks';
import { useState } from 'react';

export const NOW = new Date(2026, 2, 19, 14, 20);

const d = (month: number, day: number) => new Date(2026, month - 1, day);

const COLUMNS: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'doing', title: 'In progress', limit: 3 },
  { id: 'review', title: 'In review', limit: 2 },
  { id: 'done', title: 'Done', done: true },
];

const CARDS: KanbanCard[] = [
  {
    id: 'c1',
    columnId: 'backlog',
    reference: 'FER-231',
    title: 'Export invoices as a signed PDF bundle',
    tags: ['Invoices'],
    due: d(4, 2),
  },
  {
    id: 'c2',
    columnId: 'backlog',
    reference: 'FER-236',
    title: 'Remember the last period picked per user',
    tags: ['Settings'],
  },
  {
    id: 'c3',
    columnId: 'backlog',
    reference: 'FER-240',
    title: 'Show VAT per rate on credit notes',
    tags: ['Tax'],
    assignee: { name: 'Priya Raman' },
  },
  {
    id: 'c4',
    columnId: 'doing',
    reference: 'FER-218',
    title: 'Approval rules by cost centre',
    tags: ['Approvals', 'Policy'],
    assignee: { name: 'Ines Duarte' },
    due: d(3, 18),
    priority: 'urgent',
  },
  {
    id: 'c5',
    columnId: 'doing',
    reference: 'FER-224',
    title: 'Bank feed reconnect flow',
    tags: ['Banking'],
    assignee: { name: 'Tomasz Wierzbicki' },
    due: d(3, 19),
    priority: 'high',
  },
  {
    id: 'c6',
    columnId: 'doing',
    reference: 'FER-227',
    title: 'Seat limits on the team page',
    tags: ['Billing'],
    assignee: { name: 'Aiyana Brooks' },
    due: d(3, 21),
  },
  {
    id: 'c7',
    columnId: 'doing',
    reference: 'FER-229',
    title: 'Audit trail CSV export',
    tags: ['Compliance'],
    assignee: { name: 'Oluwaseun Adeyemi' },
  },
  {
    id: 'c8',
    columnId: 'review',
    reference: 'FER-212',
    title: 'Receipt matching by amount and date',
    tags: ['Expenses'],
    assignee: { name: 'Kenji Arakawa' },
    due: d(3, 24),
  },
  {
    id: 'c9',
    columnId: 'done',
    reference: 'FER-205',
    title: 'Two-factor recovery codes',
    tags: ['Security'],
    assignee: { name: 'Niamh Walsh' },
  },
  {
    id: 'c10',
    columnId: 'done',
    reference: 'FER-201',
    title: 'Dark mode for the ledger theme',
    tags: ['Design'],
    assignee: { name: 'Aiyana Brooks' },
  },
];

/** The demo's props: the app owns the data, here in state, in your app through your API. */
export function useKanbanBoardDemo() {
  const [cards, setCards] = useState(CARDS);
  const props: KanbanBoardProps = {
    title: 'Sprint 14',
    columns: COLUMNS,
    cards,
    today: NOW,
    locale: 'en-GB',
    onMoveCard: (id, column, index) => {
      setCards(moveKanbanCard(cards, id, column, index));
    },
    onOpenCard: () => undefined,
    onAddCard: () => undefined,
  };
  return props;
}

export default function KanbanBoardDemo() {
  const props = useKanbanBoardDemo();
  return (
    <div className="w-full">
      <KanbanBoard {...props} />
    </div>
  );
}

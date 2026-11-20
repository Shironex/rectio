'use client';

import { moveKanbanCard, type AppNotification } from '@rectio/blocks';
import { useToast } from '@rectio/ui';
import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';

import { NOTIFICATIONS } from '@/data/account';
import { TICKETS, type Ticket } from '@/data/tickets';
import { NewTicketSheet, type TicketDraft } from '../tickets/new-ticket-sheet';
import { TicketSheet, applyTicketChange } from '../tickets/ticket-sheet';

interface AppData {
  tickets: readonly Ticket[];
  moveTicket: (id: string, toColumnId: string, index: number) => void;
  notifications: readonly AppNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** Opens the new ticket sheet, optionally straight into a column of the board. */
  openNewTicket: (columnId?: string) => void;
  /** Opens a ticket's detail sheet over whatever page is showing. */
  openTicket: (id: string) => void;
}

const AppDataContext = createContext<AppData | null>(null);

/** The app's shared state and the sheets any page or the command menu can open. */
export function useAppData(): AppData {
  const value = use(AppDataContext);
  if (value === null) throw new Error('useAppData must be used inside AppDataProvider');
  return value;
}

/**
 * Holds what changes while the app is open: the ticket board, the notifications and which sheet is
 * open. Swap the state for your API calls; the pages only see the callbacks.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [tickets, setTickets] = useState<readonly Ticket[]>(TICKETS);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [draftColumn, setDraftColumn] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const createTicket = useCallback(
    (draft: TicketDraft) => {
      const number = 2148 + tickets.filter((t) => t.id.startsWith('new-')).length;
      const ticket: Ticket = {
        id: `new-${String(number)}`,
        reference: `CPL-${String(number)}`,
        columnId: draft.columnId,
        title: draft.title,
        customerId: draft.customerId,
        requester: draft.requester,
        priority: draft.priority,
        tags: draft.tags,
        ...(draft.assignee === undefined ? {} : { assignee: { name: draft.assignee } }),
        channel: 'Portal',
        opened: new Date(),
        summary: draft.summary,
      };
      setTickets((list) => [ticket, ...list]);
      toast.add({
        title: `${ticket.reference} created`,
        description: ticket.title,
        type: 'success',
      });
    },
    [tickets, toast],
  );

  const value = useMemo<AppData>(
    () => ({
      tickets,
      moveTicket: (id, toColumnId, index) => {
        // The move keeps every field of a card; the helper is typed to the base card.
        setTickets((list) => moveKanbanCard(list, id, toColumnId, index) as Ticket[]);
      },
      notifications,
      markRead: (id) => {
        setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
      },
      markAllRead: () => {
        setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      },
      openNewTicket: (columnId = 'new') => {
        setDraftColumn(columnId);
      },
      openTicket: setOpenId,
    }),
    [tickets, notifications],
  );

  const openTicket = tickets.find((t) => t.id === openId);

  return (
    <AppDataContext value={value}>
      {children}
      <NewTicketSheet
        columnId={draftColumn}
        onOpenChange={(open) => {
          if (!open) setDraftColumn(null);
        }}
        onCreate={createTicket}
      />
      <TicketSheet
        ticket={openTicket}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
        onChange={(id, change) => {
          setTickets((list) => list.map((t) => (t.id === id ? applyTicketChange(t, change) : t)));
        }}
      />
    </AppDataContext>
  );
}

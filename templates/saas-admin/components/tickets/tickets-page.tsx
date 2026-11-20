'use client';

import { KanbanIcon, MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react';
import { KanbanBoard } from '@rectio/blocks/motion';
import {
  Button,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SkeletonLine,
} from '@rectio/ui';
import { useState } from 'react';

import { customerById } from '@/data/customers';
import { TICKET_COLUMNS, type Ticket } from '@/data/tickets';
import { CURRENT_USER, LOCALE, TODAY, plural } from '@/data/workspace';
import { PageHeader } from '../page-header';
import { useAppData } from '../shell/app-data';
import { EmptyPanel, ErrorPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';

type Owner = 'all' | 'mine' | 'unassigned';

const OWNERS: readonly { value: Owner; label: string }[] = [
  { value: 'all', label: 'Everyone’s tickets' },
  { value: 'mine', label: 'Assigned to me' },
  { value: 'unassigned', label: 'Unassigned' },
];

function matches(ticket: Ticket, query: string, owner: Owner): boolean {
  if (owner === 'mine' && ticket.assignee?.name !== CURRENT_USER.name) return false;
  if (owner === 'unassigned' && ticket.assignee !== undefined) return false;
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  const customer = customerById(ticket.customerId)?.name ?? '';
  return `${ticket.reference ?? ''} ${ticket.title} ${customer} ${ticket.requester} ${(ticket.tags ?? []).join(' ')}`
    .toLowerCase()
    .includes(q);
}

function BoardLoading() {
  return (
    <LoadingRegion label="Loading the board">
      <div aria-hidden className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TICKET_COLUMNS.map((column, i) => (
          <div
            key={column.id}
            className="flex flex-col gap-3 rounded-panel border border-line bg-surface-sunken p-3"
          >
            <SkeletonLine size="sm" width="w-1/3" index={i} />
            {Array.from({ length: 3 - (i % 2) }, (_, j) => (
              <div
                key={j}
                className="flex flex-col gap-2 rounded-control border border-line bg-surface p-3"
              >
                <SkeletonLine size="xs" width="w-1/4" index={j} />
                <SkeletonLine size="base" width="w-4/5" index={j} />
                <SkeletonLine size="sm" width="w-1/2" index={j} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function TicketsPage() {
  const state = usePageState();
  const { tickets, moveTicket, openTicket, openNewTicket } = useAppData();
  const [query, setQuery] = useState('');
  const [owner, setOwner] = useState<Owner>('all');
  const shown = tickets.filter((t) => matches(t, query, owner));
  const open = tickets.filter((t) => t.columnId !== 'resolved').length;
  const filtered = query.trim() !== '' || owner !== 'all';

  // The board reports a place among the cards it shows; map it onto the full list, so a move made
  // while filtered lands next to the same neighbours.
  const move = (id: string, columnId: string, index: number) => {
    const inColumn = (list: readonly Ticket[]) =>
      list.filter((t) => t.columnId === columnId && t.id !== id);
    const anchor = inColumn(shown)[index];
    const all = inColumn(tickets);
    moveTicket(id, columnId, anchor === undefined ? all.length : all.indexOf(anchor));
  };

  return (
    <>
      <PageHeader
        title="Tickets"
        description={
          state === 'ready'
            ? `${plural(open, 'open ticket')}, ${plural(tickets.filter((t) => t.columnId === 'new').length, 'new one', 'new ones')} to triage`
            : undefined
        }
        actions={
          state === 'empty' ? undefined : (
            <Button
              onClick={() => {
                openNewTicket();
              }}
            >
              <PlusIcon aria-hidden weight="bold" className="size-4" />
              New ticket
            </Button>
          )
        }
      />
      {state === 'loading' ? (
        <BoardLoading />
      ) : state === 'error' ? (
        <ErrorPanel title="The board did not load" />
      ) : state === 'empty' ? (
        <EmptyPanel
          icon={<KanbanIcon aria-hidden weight="bold" />}
          title="No tickets yet"
          description="Messages to your support address, chats and portal requests land in New. Log a phone call by hand meanwhile."
          actions={
            <Button
              onClick={() => {
                openNewTicket();
              }}
            >
              New ticket
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              aria-label="Search tickets"
              placeholder="Search by subject, customer or tag"
              value={query}
              onValueChange={setQuery}
              shortcut="/"
              globalShortcut
              groupClassName="sm:max-w-sm sm:flex-1"
            />
            <Select
              items={OWNERS}
              value={owner}
              onValueChange={(value) => {
                if (value !== null) setOwner(value);
              }}
            >
              <SelectTrigger aria-label="Whose tickets" className="sm:w-52" />
              <SelectContent>
                {OWNERS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtered && (
              <p className="text-sm text-fg-muted sm:ms-auto" aria-live="polite">
                {plural(shown.length, 'ticket')} shown
              </p>
            )}
          </div>
          {shown.length === 0 ? (
            <EmptyPanel
              icon={<MagnifyingGlassIcon aria-hidden weight="bold" />}
              title="No tickets match"
              description="Try another word, or show everyone’s tickets."
              actions={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setOwner('all');
                  }}
                >
                  Clear the filters
                </Button>
              }
            />
          ) : (
            <KanbanBoard
              title="Ticket board"
              columns={TICKET_COLUMNS}
              cards={shown}
              today={TODAY}
              locale={LOCALE}
              onMoveCard={move}
              onOpenCard={(card) => {
                openTicket(card.id);
              }}
              onAddCard={(columnId) => {
                openNewTicket(columnId);
              }}
            />
          )}
        </>
      )}
    </>
  );
}

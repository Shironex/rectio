'use client';

import { ArrowRightIcon } from '@phosphor-icons/react';
import { type CommentThreadResolution, type ThreadComment } from '@rectio/blocks';
import { CommentThread } from '@rectio/blocks/motion';
import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  useToast,
} from '@rectio/ui';
import Link from 'next/link';
import { useState } from 'react';

import { customerById } from '@/data/customers';
import { AGENTS } from '@/data/team';
import { TICKET_COLUMNS, ticketThread, type Ticket } from '@/data/tickets';
import { CURRENT_USER, LOCALE, NOW, formatShortDate, formatTime } from '@/data/workspace';
import { PRIORITY_LABELS, PRIORITY_TONES } from './ticket-format';

/** What the sheet can change on a ticket. */
export interface TicketChange {
  columnId?: string;
  assignee?: Ticket['assignee'] | undefined;
}

/** The ticket with a sheet change applied; an `assignee` of undefined unassigns it. */
export function applyTicketChange(ticket: Ticket, change: TicketChange): Ticket {
  const columnId = change.columnId ?? ticket.columnId;
  const assignee = 'assignee' in change ? change.assignee : ticket.assignee;
  const next: Ticket = { ...ticket, columnId };
  if (assignee === undefined) delete next.assignee;
  else next.assignee = assignee;
  return next;
}

const STATUS_ITEMS = TICKET_COLUMNS.map((c) => ({ value: c.id, label: c.title }));
const ASSIGNEE_ITEMS = [
  { value: 'none', label: 'Unassigned' },
  ...AGENTS.filter((a) => a.role !== 'viewer').map((a) => ({ value: a.id, label: a.name })),
];

const WRITER = { id: CURRENT_USER.id, name: CURRENT_USER.name, role: CURRENT_USER.role };

/** A ticket's detail over the page it was opened from: who asked, where it stands, and the notes. */
export function TicketSheet({
  ticket,
  onOpenChange,
  onChange,
}: {
  /** The ticket to show; undefined keeps the sheet closed. */
  ticket: Ticket | undefined;
  onOpenChange: (open: boolean) => void;
  /** A triage change from the sheet: the column or the assignee. */
  onChange: (id: string, change: TicketChange) => void;
}) {
  return (
    <Sheet open={ticket !== undefined} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-xl">
        {ticket !== undefined && (
          <TicketDetail
            key={ticket.id}
            ticket={ticket}
            onChange={(change) => {
              onChange(ticket.id, change);
            }}
            onClose={() => {
              onOpenChange(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function TicketDetail({
  ticket,
  onChange,
  onClose,
}: {
  ticket: Ticket;
  onChange: (change: TicketChange) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [comments, setComments] = useState<ThreadComment[]>(() => ticketThread(ticket));
  const [resolved, setResolved] = useState<CommentThreadResolution | undefined>(undefined);
  const customer = customerById(ticket.customerId);
  const priority = ticket.priority ?? 'medium';

  const facts: [string, React.ReactNode][] = [
    [
      'Status',
      <Select
        key="s"
        items={STATUS_ITEMS}
        value={ticket.columnId}
        onValueChange={(value) => {
          if (value !== null) onChange({ columnId: value });
        }}
      >
        <SelectTrigger aria-label="Status" />
        <SelectContent>
          {STATUS_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>,
    ],
    [
      'Priority',
      <Badge key="p" tone={PRIORITY_TONES[priority]}>
        {PRIORITY_LABELS[priority]}
      </Badge>,
    ],
    [
      'Assignee',
      <Select
        key="a"
        items={ASSIGNEE_ITEMS}
        value={AGENTS.find((agent) => agent.name === ticket.assignee?.name)?.id ?? 'none'}
        onValueChange={(value) => {
          const agent = AGENTS.find((a) => a.id === value);
          onChange({ assignee: agent === undefined ? undefined : { name: agent.name } });
        }}
      >
        <SelectTrigger aria-label="Assignee" />
        <SelectContent>
          {ASSIGNEE_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>,
    ],
    ['Requester', ticket.requester],
    ['Channel', ticket.channel],
    ['Opened', `${formatShortDate(ticket.opened)}, ${formatTime(ticket.opened)}`],
  ];

  return (
    <>
      <SheetHeader>
        <p className="text-sm text-fg-muted numeric">{ticket.reference}</p>
        <SheetTitle className="text-balance">{ticket.title}</SheetTitle>
        <SheetDescription>
          {customer === undefined ? (
            ticket.requester
          ) : (
            <Link
              href={`/customers/${customer.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {customer.name}
              <ArrowRightIcon aria-hidden weight="bold" className="size-3.5" />
            </Link>
          )}
        </SheetDescription>
      </SheetHeader>
      <SheetBody className="gap-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          {facts.map(([label, value]) => (
            <div key={label} className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-fg-muted">{label}</dt>
              <dd className="min-w-0 text-fg">{value}</dd>
            </div>
          ))}
        </dl>
        {(ticket.tags?.length ?? 0) > 0 && (
          <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
            {ticket.tags?.map((tag) => (
              <li key={tag}>
                <Badge tone="neutral">{tag}</Badge>
              </li>
            ))}
          </ul>
        )}
        <CommentThread
          title="Conversation"
          comments={comments}
          writer={WRITER}
          now={NOW}
          locale={LOCALE}
          resolved={resolved}
          onAdd={(body, parentId) => {
            setComments((list) => [
              ...list,
              {
                id: `c-${String(list.length + 1)}`,
                author: WRITER,
                body,
                createdAt: new Date(),
                ...(parentId === undefined ? {} : { parentId }),
              },
            ]);
          }}
          onEdit={(id, body) => {
            setComments((list) =>
              list.map((c) => (c.id === id ? { ...c, body, editedAt: new Date() } : c)),
            );
          }}
          onDelete={(id) => {
            setComments((list) => list.filter((c) => c.id !== id && c.parentId !== id));
          }}
          onResolve={() => {
            setResolved({ by: CURRENT_USER.name, at: new Date() });
            toast.add({ type: 'success', title: `${ticket.reference} resolved` });
          }}
          onReopen={() => {
            setResolved(undefined);
          }}
        />
      </SheetBody>
    </>
  );
}

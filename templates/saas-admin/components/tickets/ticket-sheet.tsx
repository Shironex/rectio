'use client';

import { ArrowSquareOutIcon } from '@phosphor-icons/react';
import { type CommentThreadResolution, type ThreadComment } from '@rectio/blocks';
import { CommentThread } from '@rectio/blocks/motion';
import {
  Avatar,
  Badge,
  Button,
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
import { TICKET_COLUMNS, ticketThread, type Ticket } from '@/data/tickets';
import { CURRENT_USER, LOCALE, NOW, formatShortDate, formatTime } from '@/data/workspace';
import { PRIORITY_LABELS, PRIORITY_TONES } from './ticket-format';

const WRITER = { id: CURRENT_USER.id, name: CURRENT_USER.name, role: CURRENT_USER.role };

/** A ticket's detail over the page it was opened from: who asked, where it stands, and the notes. */
export function TicketSheet({
  ticket,
  onOpenChange,
}: {
  /** The ticket to show; undefined keeps the sheet closed. */
  ticket: Ticket | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={ticket !== undefined} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        {ticket !== undefined && (
          <TicketDetail
            key={ticket.id}
            ticket={ticket}
            onClose={() => {
              onOpenChange(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function TicketDetail({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const toast = useToast();
  const [comments, setComments] = useState<ThreadComment[]>(() => ticketThread(ticket));
  const [resolved, setResolved] = useState<CommentThreadResolution | undefined>(undefined);
  const customer = customerById(ticket.customerId);
  const column = TICKET_COLUMNS.find((c) => c.id === ticket.columnId);
  const priority = ticket.priority ?? 'medium';

  const facts: [string, React.ReactNode][] = [
    ['Status', column?.title ?? 'New'],
    [
      'Priority',
      <Badge key="p" tone={PRIORITY_TONES[priority]}>
        {PRIORITY_LABELS[priority]}
      </Badge>,
    ],
    [
      'Assignee',
      ticket.assignee === undefined ? (
        <span className="text-fg-muted">Unassigned</span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <Avatar name={ticket.assignee.name} size="xs" />
          {ticket.assignee.name}
        </span>
      ),
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
              <ArrowSquareOutIcon aria-hidden weight="bold" className="size-3.5" />
            </Link>
          )}
        </SheetDescription>
      </SheetHeader>
      <SheetBody className="gap-6">
        <dl className="grid grid-cols-3 gap-x-6 gap-y-2.5 text-sm">
          {facts.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-fg-muted">{label}</dt>
              <dd className="col-span-2 min-w-0 text-fg">{value}</dd>
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
      <div className="flex shrink-0 justify-end gap-2 border-t border-line px-5 py-3">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  );
}

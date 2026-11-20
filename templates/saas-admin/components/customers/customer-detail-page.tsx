'use client';

import {
  CopyIcon,
  DotsThreeIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
  PlusIcon,
  ProhibitIcon,
} from '@phosphor-icons/react';
import { BlockPanel, type ThreadComment, type UserRecord, type UserRole } from '@rectio/blocks';
import { CommentThread, UsersTable } from '@rectio/blocks/motion';
import {
  Avatar,
  Badge,
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Stat,
  StatGroup,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  useToast,
} from '@rectio/ui';
import { useState } from 'react';

import { customerById, customerTickets, portalUsers, type Customer } from '@/data/customers';
import { agentById } from '@/data/team';
import {
  CURRENT_USER,
  LOCALE,
  NOW,
  formatDuration,
  formatLongDate,
  formatShortDate,
  minutesAgo,
  plural,
} from '@/data/workspace';
import { useAppData } from '../shell/app-data';
import { ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { STATUS_LABELS, STATUS_TONES } from '../tickets/ticket-format';
import { usePageState } from '../use-page-state';
import { Csat, HealthBadge, PLAN_TONES } from './customer-format';

const WRITER = { id: CURRENT_USER.id, name: CURRENT_USER.name, role: CURRENT_USER.role };

function seedNotes(customer: Customer): ThreadComment[] {
  const owner = agentById(customer.ownerId)?.name ?? 'Tomás Rivera';
  return [
    {
      id: `${customer.id}-n1`,
      author: { id: customer.ownerId, name: owner, role: 'Account owner' },
      body: `${customer.contact.name} prefers a call over email for anything urgent. Office hours are 7 am to 4 pm local time.`,
      createdAt: minutesAgo(60 * 24 * 12),
    },
    {
      id: `${customer.id}-n2`,
      author: WRITER,
      body:
        customer.health === 'at-risk'
          ? 'Renewal is in doubt after the scheduling bug. I will join the next call with their operations lead.'
          : 'Quarterly check-in done. No open concerns; they asked about the new reporting exports.',
      createdAt: minutesAgo(60 * 24 * 3),
    },
  ];
}

function TicketsTab({ customer, people }: { customer: Customer; people: readonly UserRecord[] }) {
  const tickets = customerTickets(customer, people);
  return (
    <div className="overflow-x-auto rounded-panel border border-line bg-surface">
      <Table>
        <TableCaption className="sr-only">Tickets from {customer.name}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead className="max-sm:hidden">Status</TableHead>
            <TableHead className="max-md:hidden">Requester</TableHead>
            <TableHead align="end">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium text-fg">{t.subject}</span>
                  <span className="text-sm text-fg-muted numeric">
                    {t.reference}
                    <span className="sm:hidden">, {STATUS_LABELS[t.status]}</span>
                  </span>
                </span>
              </TableCell>
              <TableCell className="max-sm:hidden">
                <Badge tone={STATUS_TONES[t.status]}>{STATUS_LABELS[t.status]}</Badge>
              </TableCell>
              <TableCell className="text-fg-muted max-md:hidden">{t.requester}</TableCell>
              <TableCell align="end" className="whitespace-nowrap text-fg-muted">
                {formatShortDate(t.updated)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PeopleTab({ initial }: { initial: UserRecord[] }) {
  const toast = useToast();
  const [users, setUsers] = useState(initial);
  const patch = (ids: string[], change: Partial<UserRecord>) => {
    setUsers((list) => list.map((u) => (ids.includes(u.id) ? { ...u, ...change } : u)));
  };
  return (
    <UsersTable
      title="Portal users"
      users={users}
      now={NOW}
      locale={LOCALE}
      pageSize={8}
      onInvite={() => {
        toast.add({ title: 'Invite link copied', description: 'Send it to the person to join.' });
      }}
      onChangeRole={(ids, role: UserRole) => {
        patch(ids, { role });
      }}
      onSuspend={(ids) => {
        patch(ids, { status: 'suspended' });
      }}
      onReactivate={(ids) => {
        patch(ids, { status: 'active' });
      }}
      onRemove={(ids) => {
        setUsers((list) => list.filter((u) => !ids.includes(u.id)));
      }}
    />
  );
}

function NotesTab({ customer }: { customer: Customer }) {
  const [notes, setNotes] = useState(() => seedNotes(customer));
  return (
    <CommentThread
      title="Internal notes"
      comments={notes}
      writer={WRITER}
      now={NOW}
      locale={LOCALE}
      onAdd={(body, parentId) => {
        setNotes((list) => [
          ...list,
          {
            id: `n-${String(list.length + 1)}`,
            author: WRITER,
            body,
            createdAt: new Date(),
            ...(parentId === undefined ? {} : { parentId }),
          },
        ]);
      }}
      onEdit={(id, body) => {
        setNotes((list) =>
          list.map((n) => (n.id === id ? { ...n, body, editedAt: new Date() } : n)),
        );
      }}
      onDelete={(id) => {
        setNotes((list) => list.filter((n) => n.id !== id && n.parentId !== id));
      }}
    />
  );
}

function Details({ customer }: { customer: Customer }) {
  const owner = agentById(customer.ownerId);
  const rows: [string, React.ReactNode][] = [
    [
      'Contact',
      <span key="c" className="flex flex-col gap-1">
        <span className="font-medium text-fg">{customer.contact.name}</span>
        <a
          href={`mailto:${customer.contact.email}`}
          className="inline-flex items-center gap-1.5 text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <EnvelopeSimpleIcon aria-hidden className="size-4" />
          {customer.contact.email}
        </a>
        <a
          href={`tel:${customer.contact.phone.replace(/[^+\d]/g, '')}`}
          className="inline-flex items-center gap-1.5 text-fg-muted hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <PhoneIcon aria-hidden className="size-4" />
          <span className="numeric">{customer.contact.phone}</span>
        </a>
      </span>,
    ],
    [
      'Plan',
      <span key="p" className="flex items-center gap-2">
        <Badge tone={PLAN_TONES[customer.plan]}>{customer.plan}</Badge>
        <span className="text-fg-muted">{plural(customer.seats, 'seat')}</span>
      </span>,
    ],
    [
      'Account owner',
      owner === undefined ? (
        'Nobody'
      ) : (
        <span key="o" className="flex items-center gap-2">
          <Avatar name={owner.name} size="sm" />
          {owner.name}
        </span>
      ),
    ],
    ['Customer since', formatLongDate(customer.since)],
    [
      'Tags',
      customer.tags.length === 0 ? (
        <span className="text-fg-muted">None</span>
      ) : (
        <ul key="t" className="flex flex-wrap gap-1.5">
          {customer.tags.map((tag) => (
            <li key={tag}>
              <Badge tone="neutral">{tag}</Badge>
            </li>
          ))}
        </ul>
      ),
    ],
  ];
  return (
    <BlockPanel title="Details">
      <dl className="flex flex-col gap-4 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1">
            <dt className="text-fg-muted">{label}</dt>
            <dd className="text-fg">{value}</dd>
          </div>
        ))}
      </dl>
    </BlockPanel>
  );
}

function DetailLoading() {
  return (
    <LoadingRegion label="Loading the customer">
      <LoadingPanel kind="figures" />
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <LoadingPanel kind="table" rows={6} columns={3} tabs={3} className="lg:col-span-2" />
        <LoadingPanel kind="list" rows={4} />
      </div>
    </LoadingRegion>
  );
}

export function CustomerDetailPage({ id }: { id: string }) {
  const state = usePageState();
  const toast = useToast();
  const { openNewTicket } = useAppData();
  const customer = customerById(id);
  if (customer === undefined) return <ErrorPanel title="This customer does not exist" />;
  const people = portalUsers(customer);
  const active = people.filter((p) => p.status === 'active').length;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={customer.name} size="xl" square />
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="font-display text-2xl font-heading tracking-tight text-balance sm:text-3xl">
              {customer.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
              <Badge tone={PLAN_TONES[customer.plan]}>{customer.plan}</Badge>
              <HealthBadge health={customer.health} />
              <span>{customer.city}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 max-sm:w-full max-sm:*:flex-1">
          <Menu>
            <MenuTrigger render={<Button variant="secondary" aria-label="More actions" />}>
              <DotsThreeIcon aria-hidden weight="bold" className="size-4" />
              <span className="sm:sr-only">More</span>
            </MenuTrigger>
            <MenuContent align="end">
              <MenuItem
                icon={<CopyIcon aria-hidden className="size-4" />}
                onClick={() => {
                  toast.add({ title: 'Portal link copied' });
                }}
              >
                Copy portal link
              </MenuItem>
              <MenuItem
                icon={<EnvelopeSimpleIcon aria-hidden className="size-4" />}
                onClick={() => {
                  toast.add({ title: `Email drafted to ${customer.contact.name}` });
                }}
              >
                Email the contact
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                icon={<ProhibitIcon aria-hidden className="size-4" />}
                onClick={() => {
                  toast.add({
                    title: 'Portal access paused',
                    description: `${customer.name} can still email support.`,
                  });
                }}
              >
                Pause portal access
              </MenuItem>
            </MenuContent>
          </Menu>
          <Button
            onClick={() => {
              openNewTicket();
            }}
          >
            <PlusIcon aria-hidden weight="bold" className="size-4" />
            New ticket
          </Button>
        </div>
      </div>
      {state === 'loading' ? (
        <DetailLoading />
      ) : state === 'error' ? (
        <ErrorPanel title={`${customer.name} did not load`} />
      ) : (
        <>
          <StatGroup aria-label="Account figures">
            <Stat
              label="Open tickets"
              value={state === 'empty' ? '0' : String(customer.openTickets)}
            />
            <Stat
              label="Satisfaction, 90 days"
              value={<Csat value={state === 'empty' ? null : customer.csat} />}
            />
            <Stat label="Median first reply" value={formatDuration(customer.firstResponse)} />
            <Stat
              label="Portal users"
              value={String(people.length)}
              description={`${String(active)} active`}
            />
          </StatGroup>
          <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
            <Tabs defaultValue="tickets" className="min-w-0 lg:col-span-2">
              <TabsList>
                <TabsTab value="tickets">Tickets</TabsTab>
                <TabsTab value="people">People</TabsTab>
                <TabsTab value="notes">Notes</TabsTab>
              </TabsList>
              <TabsPanel value="tickets">
                {state === 'empty' ? (
                  <p className="rounded-panel border border-line bg-surface p-6 text-sm text-fg-muted">
                    No tickets from {customer.name} yet.
                  </p>
                ) : (
                  <TicketsTab customer={customer} people={people} />
                )}
              </TabsPanel>
              <TabsPanel value="people">
                <PeopleTab initial={people} />
              </TabsPanel>
              <TabsPanel value="notes">
                <NotesTab customer={customer} />
              </TabsPanel>
            </Tabs>
            <Details customer={customer} />
          </div>
        </>
      )}
    </>
  );
}

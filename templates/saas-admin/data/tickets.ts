import type { KanbanCard, KanbanColumn, ThreadComment } from '@rectio/blocks';

import { AGENTS } from './team';
import { CURRENT_USER, NOW, TODAY, addDays, minutesAgo } from './workspace';

/** The ticket board: a ticket moves left to right as the team works it. */
export const TICKET_COLUMNS: readonly KanbanColumn[] = [
  { id: 'new', title: 'New' },
  { id: 'open', title: 'In progress', limit: 6 },
  { id: 'waiting', title: 'Waiting on customer' },
  { id: 'resolved', title: 'Resolved', done: true },
];

/** A ticket as the board and its detail sheet need it. */
export interface Ticket extends KanbanCard {
  customerId: string;
  requester: string;
  channel: 'Email' | 'Chat' | 'Phone' | 'Portal';
  opened: Date;
  summary: string;
}

const agent = (id: string) => {
  const found = AGENTS.find((a) => a.id === id);
  return found === undefined ? undefined : { name: found.name };
};

type Row = [
  id: number,
  columnId: string,
  title: string,
  customerId: string,
  requester: string,
  priority: NonNullable<KanbanCard['priority']>,
  tags: string[],
  assigneeId: string | null,
  dueInDays: number | null,
  channel: Ticket['channel'],
  openedMinutesAgo: number,
  summary: string,
];

const ROWS: Row[] = [
  [
    2147,
    'new',
    'Card payments fail for customers paying by Apple Pay',
    'tern-bay-pools',
    'Luis Ferreira',
    'urgent',
    ['Payments', 'Bug'],
    null,
    0,
    'Chat',
    18,
    'Since this morning every Apple Pay attempt on the customer booking page returns "payment declined". Cards entered by hand still go through.',
  ],
  [
    2146,
    'new',
    'Add a second dispatcher login without another seat',
    'ashgrove-landscapes',
    'Owen Ashby',
    'low',
    ['Billing', 'How-to'],
    null,
    2,
    'Email',
    54,
    'Owen wants his partner to see the dispatch board on Saturdays. Asks whether a read only login counts toward the seat total.',
  ],
  [
    2145,
    'new',
    'Booking page offers slots on Thanksgiving',
    'larkspur-cleaning',
    'Abena Mensah',
    'high',
    ['Scheduling'],
    null,
    1,
    'Portal',
    96,
    'The holiday calendar was set, but the public booking page still lets customers pick Thursday 26 November.',
  ],
  [
    2143,
    'open',
    'Recurring jobs skip the last Friday of the month',
    'halden-roofing',
    'Erik Halden',
    'urgent',
    ['Scheduling', 'Bug', 'Escalated'],
    'u-ines',
    0,
    'Phone',
    60 * 20,
    'Monthly gutter inspections set to "last Friday" were never created for October or November. Two crews went to the wrong addresses.',
  ],
  [
    2141,
    'open',
    'QuickBooks sync stopped after the password change',
    'kestrel-solar',
    'Arjun Mehta',
    'high',
    ['Integrations'],
    'u-priya',
    1,
    'Email',
    60 * 26,
    'Invoices raised since Monday are not in QuickBooks. The connection page says connected, but the last sync was 16 November.',
  ],
  [
    2139,
    'open',
    'Technicians cannot open job notes offline',
    'okafor-electrical',
    'Chidi Okafor',
    'medium',
    ['Mobile app'],
    'u-hannah',
    2,
    'Chat',
    60 * 30,
    'On Android 15 the notes tab spins forever without signal. iOS is fine.',
  ],
  [
    2137,
    'open',
    'Export timesheets by week for payroll',
    'quarry-lane-builders',
    'Grace Whitfield',
    'medium',
    ['Reporting', 'Feature request'],
    'u-kwame',
    3,
    'Email',
    60 * 44,
    'Payroll runs weekly; the export only offers month ranges. Grace asks for a weekly preset or a custom range.',
  ],
  [
    2135,
    'open',
    'Duplicate customers after CSV import',
    'saltmarsh-pest',
    'Dev Patel',
    'high',
    ['Data', 'Escalated'],
    'u-kwame',
    -1,
    'Email',
    60 * 52,
    'An import of 1,240 customers created 318 duplicates. Dev needs them merged before Friday route planning.',
  ],
  [
    2131,
    'waiting',
    'Invoice PDF shows the old company address',
    'wexley-fire',
    'Imogen Wexley',
    'low',
    ['Billing'],
    'u-tomas',
    4,
    'Portal',
    60 * 70,
    'Asked Imogen to confirm whether the address changed under Company or under Branding. Waiting for a screenshot.',
  ],
  [
    2129,
    'waiting',
    'SMS reminders arrive an hour late',
    'mistral-hvac',
    'Camille Roux',
    'medium',
    ['Notifications'],
    'u-priya',
    2,
    'Chat',
    60 * 75,
    'Likely the account time zone. Asked Camille to check Settings, Locale and send a reminder log.',
  ],
  [
    2126,
    'waiting',
    'Move a job between crews without losing the history',
    'castlerock-paving',
    'Diego Alvarez',
    'low',
    ['How-to'],
    'u-leo',
    5,
    'Email',
    60 * 90,
    'Sent the steps for reassigning with history kept. Waiting to hear it worked.',
  ],
  [
    2124,
    'waiting',
    'Quote template lost its logo',
    'stonebrook-drainage',
    'Patrick Doyle',
    'medium',
    ['Documents'],
    'u-sana',
    3,
    'Email',
    60 * 98,
    'The logo file was over 2 MB. Asked Patrick for a smaller PNG.',
  ],
  [
    2121,
    'resolved',
    'Two-factor codes not reaching a new phone',
    'brennan-plumbing',
    'Siobhan Brennan',
    'high',
    ['Security'],
    'u-tomas',
    null,
    'Phone',
    60 * 120,
    'Reset two-factor after confirming identity on a call. Siobhan set up an authenticator app instead.',
  ],
  [
    2118,
    'resolved',
    'Add the new branch to the dispatch map',
    'ironbridge-scaffolding',
    'Rhys Morgan',
    'low',
    ['How-to'],
    'u-leo',
    null,
    'Email',
    60 * 140,
    'Walked Rhys through branches and service areas. Map updated.',
  ],
  [
    2115,
    'resolved',
    'Refund the duplicate annual charge',
    'oakhurst-electrical',
    'Hamid Rahimi',
    'medium',
    ['Billing'],
    'u-ruairi',
    null,
    'Email',
    60 * 160,
    'Refunded $1,188.00 to the card ending 4417. Receipt sent.',
  ],
];

/** Every ticket on the board, in board order. */
export const TICKETS: readonly Ticket[] = ROWS.map(
  ([
    n,
    columnId,
    title,
    customerId,
    requester,
    priority,
    tags,
    assigneeId,
    due,
    channel,
    opened,
    summary,
  ]) => {
    const assignee = assigneeId === null ? undefined : agent(assigneeId);
    return {
      id: `cpl-${String(n)}`,
      reference: `CPL-${String(n)}`,
      columnId,
      title,
      customerId,
      requester,
      priority,
      tags,
      ...(assignee === undefined ? {} : { assignee }),
      ...(due === null ? {} : { due: addDays(TODAY, due) }),
      channel,
      opened: minutesAgo(opened),
      summary,
    };
  },
);

export const TICKET_TAGS = [...new Set(TICKETS.flatMap((t) => t.tags ?? []))].sort();

/** The internal notes on a ticket: the requester's message, then the team's back and forth. */
export function ticketThread(ticket: Ticket): ThreadComment[] {
  const opened = ticket.opened.getTime();
  // Replies never sit in the future of the sample's clock, however fresh the ticket is.
  const after = (minutes: number) => new Date(Math.min(opened + minutes * 60_000, NOW.getTime()));
  const assignee = ticket.assignee?.name ?? 'Tomás Rivera';
  return [
    {
      id: `${ticket.id}-c1`,
      author: { id: 'requester', name: ticket.requester, role: 'Customer' },
      body: ticket.summary,
      createdAt: new Date(opened),
    },
    {
      id: `${ticket.id}-c2`,
      author: { id: 'agent', name: assignee, role: 'Agent' },
      body: 'Reproduced on a test account. Looping in engineering with the account id and the steps.',
      createdAt: after(9),
    },
    {
      id: `${ticket.id}-c3`,
      author: { id: CURRENT_USER.id, name: CURRENT_USER.name, role: 'Head of support' },
      body: 'Thanks. Please send the customer an update before end of day, even if engineering has nothing yet.',
      createdAt: after(16),
      parentId: `${ticket.id}-c2`,
    },
  ];
}

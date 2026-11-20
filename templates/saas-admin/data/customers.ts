import type { UserRecord } from '@rectio/blocks';

import { TICKETS } from './tickets';
import { NOW, at, minutesAgo } from './workspace';

export type CustomerPlan = 'Starter' | 'Team' | 'Business';
export type CustomerHealth = 'healthy' | 'watch' | 'at-risk';

/** A business that uses Copperline and writes to its support team. */
export interface Customer {
  id: string;
  name: string;
  plan: CustomerPlan;
  /** Copperline seats the customer pays for. */
  seats: number;
  contact: { name: string; email: string; phone: string };
  city: string;
  since: Date;
  openTickets: number;
  /** Satisfaction over the last 90 days, as a fraction; null when nobody has rated yet. */
  csat: number | null;
  /** Median first response over the last 90 days, in minutes. */
  firstResponse: number;
  health: CustomerHealth;
  lastContact: Date;
  /** The agent who looks after the account. */
  ownerId: string;
  tags: readonly string[];
}

export const PLAN_ORDER: readonly CustomerPlan[] = ['Starter', 'Team', 'Business'];

export const HEALTH_LABELS: Record<CustomerHealth, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  'at-risk': 'At risk',
};

export const HEALTH_HINTS: Record<CustomerHealth, string> = {
  healthy: 'Ratings and response times are on target',
  watch: 'Open tickets are piling up or ratings slipped this month',
  'at-risk': 'Low ratings and an open escalation: renewal is in doubt',
};

type Row = [
  id: string,
  name: string,
  plan: CustomerPlan,
  seats: number,
  contact: string,
  city: string,
  since: Date,
  open: number,
  csat: number | null,
  firstResponse: number,
  health: CustomerHealth,
  lastContactMinutes: number,
  ownerId: string,
  tags: string[],
];

const ROWS: Row[] = [
  [
    'brennan-plumbing',
    'Brennan Plumbing & Heating',
    'Business',
    42,
    'Siobhan Brennan',
    'Boston, MA',
    at(3, 4, 9, 0, 2023),
    4,
    0.96,
    38,
    'healthy',
    22,
    'u-tomas',
    ['Priority', 'Payments'],
  ],
  [
    'okafor-electrical',
    'Okafor Electrical',
    'Team',
    14,
    'Chidi Okafor',
    'Houston, TX',
    at(8, 21, 9, 0, 2024),
    2,
    0.91,
    64,
    'healthy',
    95,
    'u-kwame',
    ['Mobile app'],
  ],
  [
    'halden-roofing',
    'Halden Roofing',
    'Business',
    31,
    'Erik Halden',
    'Minneapolis, MN',
    at(1, 12, 9, 0, 2022),
    7,
    0.78,
    142,
    'at-risk',
    48,
    'u-ines',
    ['Escalated', 'Renewal Q1'],
  ],
  [
    'mistral-hvac',
    'Mistral HVAC',
    'Team',
    18,
    'Camille Roux',
    'Denver, CO',
    at(5, 30, 9, 0, 2024),
    3,
    0.88,
    71,
    'watch',
    180,
    'u-priya',
    ['Integrations'],
  ],
  [
    'ashgrove-landscapes',
    'Ashgrove Landscapes',
    'Starter',
    4,
    'Owen Ashby',
    'Portland, OR',
    at(9, 2, 9, 0, 2025),
    1,
    1,
    52,
    'healthy',
    60 * 26,
    'u-leo',
    [],
  ],
  [
    'pinewood-joinery',
    'Pinewood Joinery',
    'Team',
    9,
    'Maeve Kelly',
    'Chicago, IL',
    at(11, 18, 9, 0, 2023),
    0,
    0.94,
    47,
    'healthy',
    60 * 24 * 4,
    'u-hannah',
    ['Mobile app'],
  ],
  [
    'tern-bay-pools',
    'Tern Bay Pools',
    'Business',
    26,
    'Luis Ferreira',
    'Tampa, FL',
    at(2, 9, 9, 0, 2023),
    5,
    0.86,
    88,
    'watch',
    140,
    'u-tomas',
    ['Payments', 'Seasonal'],
  ],
  [
    'larkspur-cleaning',
    'Larkspur Cleaning Co.',
    'Team',
    22,
    'Abena Mensah',
    'Atlanta, GA',
    at(6, 14, 9, 0, 2024),
    2,
    0.97,
    33,
    'healthy',
    310,
    'u-sana',
    ['Onboarding'],
  ],
  [
    'redfern-locksmiths',
    'Redfern Locksmiths',
    'Starter',
    3,
    'Tom Redfern',
    'Sacramento, CA',
    at(10, 1, 9, 0, 2025),
    1,
    null,
    95,
    'healthy',
    60 * 30,
    'u-leo',
    ['New'],
  ],
  [
    'quarry-lane-builders',
    'Quarry Lane Builders',
    'Business',
    58,
    'Grace Whitfield',
    'Pittsburgh, PA',
    at(4, 22, 9, 0, 2021),
    6,
    0.9,
    41,
    'healthy',
    12,
    'u-ines',
    ['Priority', 'API'],
  ],
  [
    'saltmarsh-pest',
    'Saltmarsh Pest Control',
    'Team',
    11,
    'Dev Patel',
    'Charleston, SC',
    at(7, 7, 9, 0, 2024),
    3,
    0.72,
    133,
    'at-risk',
    200,
    'u-kwame',
    ['Escalated'],
  ],
  [
    'hollis-grant',
    'Hollis & Grant Glazing',
    'Team',
    16,
    'Naomi Grant',
    'Columbus, OH',
    at(12, 3, 9, 0, 2023),
    1,
    0.93,
    58,
    'healthy',
    60 * 50,
    'u-hannah',
    [],
  ],
  [
    'kestrel-solar',
    'Kestrel Solar',
    'Business',
    37,
    'Arjun Mehta',
    'Phoenix, AZ',
    at(3, 15, 9, 0, 2022),
    4,
    0.89,
    66,
    'watch',
    75,
    'u-priya',
    ['API', 'Integrations'],
  ],
  [
    'juniper-garden',
    'Juniper Garden Care',
    'Starter',
    5,
    'Ellie Juniper',
    'Raleigh, NC',
    at(2, 26, 9, 0, 2025),
    0,
    0.95,
    44,
    'healthy',
    60 * 24 * 9,
    'u-leo',
    [],
  ],
  [
    'ironbridge-scaffolding',
    'Ironbridge Scaffolding',
    'Business',
    44,
    'Rhys Morgan',
    'Detroit, MI',
    at(9, 9, 9, 0, 2022),
    3,
    0.92,
    52,
    'healthy',
    160,
    'u-tomas',
    ['Payments'],
  ],
  [
    'wexley-fire',
    'Wexley Fire Safety',
    'Team',
    13,
    'Imogen Wexley',
    'Baltimore, MD',
    at(1, 19, 9, 0, 2024),
    2,
    0.84,
    97,
    'watch',
    60 * 5,
    'u-sana',
    ['Compliance'],
  ],
  [
    'bluebell-removals',
    'Bluebell Removals',
    'Starter',
    6,
    'Kofi Boateng',
    'Nashville, TN',
    at(5, 5, 9, 0, 2025),
    1,
    0.9,
    61,
    'healthy',
    60 * 40,
    'u-hannah',
    [],
  ],
  [
    'castlerock-paving',
    'Castlerock Paving',
    'Team',
    19,
    'Diego Alvarez',
    'San Antonio, TX',
    at(10, 28, 9, 0, 2023),
    2,
    0.87,
    79,
    'healthy',
    60 * 8,
    'u-kwame',
    ['Mobile app'],
  ],
  [
    'fennimore-appliance',
    'Fennimore Appliance Repair',
    'Team',
    12,
    'Rosa Fennimore',
    'Kansas City, MO',
    at(8, 2, 9, 0, 2024),
    0,
    0.98,
    29,
    'healthy',
    60 * 24 * 3,
    'u-priya',
    [],
  ],
  [
    'oakhurst-electrical',
    'Oakhurst Electrical',
    'Business',
    29,
    'Hamid Rahimi',
    'Seattle, WA',
    at(6, 11, 9, 0, 2022),
    3,
    0.91,
    49,
    'healthy',
    230,
    'u-ines',
    ['Priority'],
  ],
  [
    'driftwood-decking',
    'Driftwood Decking',
    'Starter',
    2,
    'Ben Carver',
    'San Diego, CA',
    at(11, 2, 9, 0, 2025),
    1,
    null,
    120,
    'watch',
    60 * 3,
    'u-leo',
    ['New', 'Trial ends soon'],
  ],
  [
    'marigold-windows',
    'Marigold Window Cleaning',
    'Team',
    8,
    'Lena Fischer',
    'Milwaukee, WI',
    at(4, 8, 9, 0, 2024),
    1,
    0.94,
    55,
    'healthy',
    60 * 24 * 2,
    'u-sana',
    [],
  ],
  [
    'stonebrook-drainage',
    'Stonebrook Drainage',
    'Team',
    15,
    'Patrick Doyle',
    'Philadelphia, PA',
    at(9, 17, 9, 0, 2023),
    2,
    0.81,
    104,
    'watch',
    60 * 7,
    'u-kwame',
    ['Payments'],
  ],
  [
    'vale-street-plastering',
    'Vale Street Plastering',
    'Starter',
    3,
    'Amara Nwosu',
    'Richmond, VA',
    at(7, 23, 9, 0, 2025),
    0,
    0.93,
    63,
    'healthy',
    60 * 24 * 12,
    'u-hannah',
    [],
  ],
];

const emailFor = (name: string, company: string) => {
  const first = name.split(' ')[0]?.toLowerCase() ?? 'hello';
  const domain = company
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 18);
  return `${first}@${domain}.com`;
};

export const CUSTOMERS: readonly Customer[] = ROWS.map(
  ([id, name, plan, seats, contact, city, since, , csat, fr, health, last, ownerId, tags], i) => ({
    id,
    name,
    plan,
    seats,
    contact: {
      name: contact,
      email: emailFor(contact, name),
      phone: `+1 (${String(201 + ((i * 37) % 700))}) 555-${String(1000 + ((i * 7919) % 9000)).padStart(4, '0')}`,
    },
    city,
    since,
    // Counted from the board, so a customer's open tickets match the tickets page.
    openTickets: TICKETS.filter((t) => t.customerId === id && t.columnId !== 'resolved').length,
    csat,
    firstResponse: fr,
    health,
    lastContact: minutesAgo(last),
    ownerId,
    tags,
  }),
);

export function customerById(id: string): Customer | undefined {
  return CUSTOMERS.find((customer) => customer.id === id);
}

/** A small seeded random source, so every customer's generated detail is the same on every build. */
function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  // A small, well-mixed generator (mulberry32): the same seed gives the same data every build.
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  'Aoife',
  'Marcus',
  'Lucía',
  'Jonah',
  'Keiko',
  'Tariq',
  'Bridget',
  'Femi',
  'Clara',
  'Rohan',
  'Nadia',
  'Samir',
  'Holly',
  'Ivan',
  'Zara',
  'Callum',
];
const LAST = [
  'Duffy',
  'Hale',
  'Moreno',
  'Price',
  'Sato',
  'Haddad',
  'Quinn',
  'Adeyemi',
  'Novak',
  'Iyer',
  'Petrova',
  'Khan',
  'Barnes',
  'Kuznetsov',
  'Ahmed',
  'Reid',
];
const TEAMS = ['Office', 'Dispatch', 'Field crew', 'Accounts'];

/**
 * The customer's people who can sign in to the help portal: the contact is the owner, the rest a
 * few office and dispatch staff. Generated from the customer's id, so it never changes.
 */
export function portalUsers(customer: Customer): UserRecord[] {
  const random = seeded(customer.id);
  const domain = customer.contact.email.split('@')[1] ?? 'example.com';
  const count = Math.min(3 + Math.floor(customer.seats / 6), 9);
  const users: UserRecord[] = [
    {
      id: `${customer.id}-owner`,
      name: customer.contact.name,
      email: customer.contact.email,
      role: 'owner',
      status: 'active',
      lastSeen: customer.lastContact,
      team: 'Office',
    },
  ];
  for (let i = 1; i < count; i += 1) {
    const first = FIRST[Math.floor(random() * FIRST.length)] ?? 'Sam';
    const last = LAST[Math.floor(random() * LAST.length)] ?? 'Lee';
    const roll = random();
    const status = roll > 0.9 ? 'suspended' : roll > 0.78 ? 'invited' : 'active';
    users.push({
      id: `${customer.id}-u${String(i)}`,
      name: `${first} ${last}`,
      email: `${first
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')}.${last.toLowerCase()}@${domain}`,
      role: i === 1 ? 'admin' : random() > 0.82 ? 'guest' : 'member',
      status,
      ...(status === 'invited'
        ? {}
        : { lastSeen: new Date(NOW.getTime() - Math.floor(random() * 60 * 24 * 21) * 60_000) }),
      team: TEAMS[Math.floor(random() * TEAMS.length)] ?? 'Office',
    });
  }
  return users;
}

export type TicketStatus = 'new' | 'open' | 'waiting' | 'resolved';

/** One line of a customer's ticket history. */
export interface CustomerTicket {
  id: string;
  reference: string;
  subject: string;
  status: TicketStatus;
  requester: string;
  updated: Date;
  /** Minutes to the first reply. */
  firstResponse: number;
}

const SUBJECTS = [
  'Recurring jobs skip the last Friday of the month',
  'Card payment declined at checkout in the customer app',
  'Technician cannot see the job notes offline',
  'Invoice PDF shows the old company address',
  'Sync with the accounting app stopped yesterday',
  'How do we move a job between two crews?',
  'SMS reminders arrive an hour late',
  'Request: export timesheets by week',
  'Duplicate customers after the CSV import',
  'Quote template lost its logo',
  'Two-factor codes not reaching a new phone',
  'Booking page shows slots on a public holiday',
  'Crew calendar is blank on Monday mornings',
  'Can a customer sign a quote on their phone?',
  'Photos attached to a job do not upload',
  'Change the reply-to address on invoices',
];

/** The customer's recent tickets, newest first, as many as its open count plus some resolved. */
export function customerTickets(
  customer: Customer,
  people: readonly UserRecord[],
): CustomerTicket[] {
  const random = seeded(`${customer.id}-tickets`);
  // The board's tickets first, as the board shows them, then older resolved history.
  const board: CustomerTicket[] = TICKETS.filter((t) => t.customerId === customer.id).map((t) => ({
    id: t.id,
    reference: t.reference ?? t.id,
    subject: t.title,
    status:
      t.columnId === 'new' || t.columnId === 'waiting' || t.columnId === 'resolved'
        ? t.columnId
        : 'open',
    requester: t.requester,
    updated: t.opened,
    firstResponse: customer.firstResponse,
  }));
  const taken = new Set(board.map((t) => t.subject));
  const subjects = SUBJECTS.filter((subject) => !taken.has(subject));
  const history = Math.min(subjects.length, 4 + Math.floor(random() * 5));
  const list = [...board];
  const oldest = Math.min(...board.map((t) => t.updated.getTime()), NOW.getTime());
  let minutes =
    Math.round((NOW.getTime() - oldest) / 60_000) + 60 * 24 + Math.floor(random() * 600);
  let reference = 2100 - Math.floor(random() * 20);
  // Walk the subjects in order from a seeded start, so none repeats within a customer.
  const first = Math.floor(random() * subjects.length);
  for (let i = 0; i < history; i += 1) {
    list.push({
      id: `${customer.id}-t${String(i)}`,
      reference: `CPL-${String(reference)}`,
      subject: subjects[(first + i) % subjects.length] ?? 'Question about the app',
      status: 'resolved',
      requester: people[Math.floor(random() * people.length)]?.name ?? customer.contact.name,
      updated: new Date(NOW.getTime() - minutes * 60_000),
      firstResponse: Math.round(customer.firstResponse * (0.5 + random())),
    });
    minutes += 180 + Math.floor(random() * 60 * 24 * 4);
    reference -= 30 + Math.floor(random() * 40);
  }
  return list;
}

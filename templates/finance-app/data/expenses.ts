import type { ApprovalState, ApprovalStatus, AuditEvent, ExpenseRequest } from '@rectio/blocks';

import { day } from './company';

export const EXPENSE_CATEGORIES = [
  'Travel',
  'Accommodation',
  'Meals',
  'Software',
  'Equipment',
  'Training',
  'Client entertainment',
  'Office',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Expenses over this need a receipt and a second look. */
export const RECEIPT_LIMIT = 25;

type Row = [
  employee: string,
  merchant: string,
  category: ExpenseCategory,
  date: Date,
  amount: number,
  status: ApprovalStatus,
  flags?: string[],
];

const ROWS: Row[] = [
  // Waiting for a decision, newest first.
  ['Clara Hughes', 'Aer Lingus', 'Travel', day(2026, 11, 17), 318.4, 'pending'],
  [
    'Tom Avery',
    'The Westbury',
    'Accommodation',
    day(2026, 11, 16),
    689,
    'pending',
    ['Over the nightly hotel limit of €220'],
  ],
  ['Clara Hughes', 'FreeNow', 'Travel', day(2026, 11, 17), 23.4, 'pending'],
  ['Jonas Berg', 'JetBrains', 'Software', day(2026, 11, 14), 289, 'pending'],
  [
    'Aoife Byrne',
    'Bastible',
    'Client entertainment',
    day(2026, 11, 18),
    214.5,
    'pending',
    ['No receipt'],
  ],
  ['Tom Avery', 'Irish Rail', 'Travel', day(2026, 11, 15), 38.9, 'pending'],
  [
    'Sofia Lindqvist',
    'Dell Ireland',
    'Equipment',
    day(2026, 11, 13),
    1_249,
    'pending',
    ['Needs a second approver above €1,000'],
  ],
  ['Cian Doherty', 'Udemy Business', 'Training', day(2026, 11, 12), 119.99, 'pending'],
  ['Aoife Byrne', 'Circle K', 'Travel', day(2026, 11, 11), 71.2, 'pending'],
  // Decided.
  ['Jonas Berg', 'Figma', 'Software', day(2026, 11, 9), 540, 'approved'],
  ['Clara Hughes', 'Hotel Bristol, Dublin', 'Accommodation', day(2026, 11, 5), 412, 'approved'],
  ['Clara Hughes', 'KLM', 'Travel', day(2026, 11, 3), 286.75, 'approved'],
  ['Tom Avery', 'Avis', 'Travel', day(2026, 11, 6), 164.3, 'approved'],
  ['Sofia Lindqvist', 'GitHub', 'Software', day(2026, 11, 2), 84, 'approved'],
  ['Rory Quinn', 'Chartered Accountants Ireland', 'Training', day(2026, 10, 30), 395, 'approved'],
  ['Aoife Byrne', 'Lufthansa', 'Travel', day(2026, 10, 28), 498.6, 'approved'],
  ['Aoife Byrne', 'Motel One, Hamburg', 'Accommodation', day(2026, 10, 28), 268, 'approved'],
  ['Jonas Berg', 'Officeworks', 'Office', day(2026, 10, 27), 46.8, 'approved'],
  ['Tom Avery', 'Chapter One', 'Client entertainment', day(2026, 10, 23), 186, 'approved'],
  ['Cian Doherty', 'Bus Éireann', 'Travel', day(2026, 10, 21), 22.5, 'approved'],
  ['Clara Hughes', 'Notion', 'Software', day(2026, 10, 20), 96, 'approved'],
  ['Sofia Lindqvist', 'Apple', 'Equipment', day(2026, 10, 15), 2_349, 'approved'],
  ['Aoife Byrne', 'Ryanair', 'Travel', day(2026, 11, 4), 186.2, 'rejected'],
  ['Tom Avery', 'The Shelbourne', 'Meals', day(2026, 10, 29), 342, 'rejected'],
  ['Jonas Berg', 'Steam', 'Software', day(2026, 10, 26), 59.99, 'rejected'],
  ['Cian Doherty', 'Uber', 'Travel', day(2026, 10, 18), 41.3, 'rejected'],
];

const REASONS: Record<string, string> = {
  Ryanair: 'Booked outside the travel tool, rebook through it',
  'The Shelbourne': 'Team dinners need a pre-approval above €250',
  Steam: 'Not a business tool, please claim it personally',
  Uber: 'Duplicate of a claim from 17 October',
};

const DECIDERS = ['Niamh Walsh', 'Rory Quinn', 'Sofia Lindqvist'];

function at(date: Date, days: number, hour: number, minute: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, hour, minute);
}

function build(): ApprovalState {
  const requests: ExpenseRequest[] = ROWS.map(
    ([employee, merchant, category, date, amount, status, flags], index) => ({
      id: `x${String(index + 1).padStart(2, '0')}`,
      employee,
      merchant,
      category,
      date,
      amount,
      status,
      ...(flags === undefined ? {} : { flags }),
    }),
  );
  const events: AuditEvent[] = [];
  requests.forEach((request, index) => {
    events.push({
      id: `ev-s-${request.id}`,
      requestId: request.id,
      action: 'submitted',
      actor: request.employee,
      at: at(request.date, 1, 9 + (index % 7), (index * 13) % 60),
    });
    if (request.status === 'pending') return;
    const reason = REASONS[request.merchant];
    events.push({
      id: `ev-d-${request.id}`,
      requestId: request.id,
      action: request.status,
      actor: DECIDERS[index % DECIDERS.length] ?? 'Niamh Walsh',
      at: at(request.date, 3, 10 + (index % 6), (index * 7) % 60),
      ...(reason === undefined ? {} : { reason }),
    });
  });
  events.sort((a, b) => a.at.getTime() - b.at.getTime());
  return { requests, events };
}

export const EXPENSES: ApprovalState = build();

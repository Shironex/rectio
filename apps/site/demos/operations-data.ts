import type { BookEntry, Payout, ReconciliationMatch, StatementLine, Vendor } from '@rectio/blocks';

/** Sample data for the operations block demos. The demos' today is 19 March 2026. */
export const OPS_TODAY = new Date(2026, 2, 19);

const d = (month: number, day: number, year = 2026) => new Date(year, month - 1, day);

export const STATEMENT: StatementLine[] = [
  {
    id: 's1',
    date: d(3, 2),
    description: 'Kestrel Analytics Ltd',
    reference: 'INV-2026-0121',
    amount: 6_240,
  },
  { id: 's2', date: d(3, 3), description: 'Card processing fee', amount: -38.4 },
  { id: 's3', date: d(3, 5), description: 'Payroll, March', reference: 'PAY-03', amount: -18_400 },
  {
    id: 's4',
    date: d(3, 6),
    description: 'Nordwind Logistik GmbH',
    reference: 'INV-2026-0118',
    amount: 18_450,
  },
  {
    id: 's5',
    date: d(3, 10),
    description: 'Kingsway Estates, rent',
    reference: 'RENT-0326',
    amount: -2_850,
  },
  { id: 's6', date: d(3, 12), description: 'Atlas Cloud Services', amount: -1_264.18 },
];

export const BOOK: BookEntry[] = [
  {
    id: 'b1',
    date: d(3, 1),
    description: 'Receipt, Kestrel Analytics',
    reference: 'INV-2026-0121',
    amount: 6_240,
  },
  { id: 'b3', date: d(3, 4), description: 'Salaries, March', amount: -18_400 },
  {
    id: 'b4',
    date: d(3, 6),
    description: 'Receipt, Nordwind Logistik',
    reference: 'INV-2026-0118',
    amount: 18_450,
  },
  {
    id: 'b5',
    date: d(3, 10),
    description: 'Rent, Kingsway office',
    reference: 'RENT-0326',
    amount: -2_850,
  },
  { id: 'b6', date: d(3, 11), description: 'Hosting, March', amount: -1_264.18 },
  { id: 'b7', date: d(3, 14), description: 'Cheque 000142', reference: '000142', amount: -760 },
];

export const MATCHES: ReconciliationMatch[] = [
  { bankId: 's4', bookId: 'b4' },
  { bankId: 's5', bookId: 'b5' },
];

/** The difference is exactly the card fee less the uncleared cheque. */
export const BOOK_BALANCE = 48_310.55;
export const STATEMENT_BALANCE = 48_310.55 - 38.4 + 760;

export const PAYOUTS: Payout[] = [
  {
    id: 'p1',
    payee: 'Barrett Furniture Ltd',
    amount: 4_200,
    method: 'bank-transfer',
    destination: '•• 7730',
    status: 'scheduled',
    date: d(3, 21),
  },
  {
    id: 'p2',
    payee: 'Kingsway Estates',
    amount: 2_850,
    method: 'bank-transfer',
    destination: '•• 1029',
    status: 'scheduled',
    date: d(3, 24),
  },
  {
    id: 'p3',
    payee: 'Atlas Cloud Services',
    amount: 1_264.18,
    method: 'card',
    destination: '•• 4417',
    status: 'in-transit',
    date: d(3, 20),
  },
  {
    id: 'p4',
    payee: 'Nordwind Logistik GmbH',
    amount: 3_120,
    method: 'bank-transfer',
    destination: '•• 8802',
    status: 'paid',
    date: d(3, 16),
  },
  {
    id: 'p5',
    payee: 'Studio Maren Holt',
    amount: 980,
    method: 'wallet',
    status: 'paid',
    date: d(3, 9),
  },
  {
    id: 'p6',
    payee: 'Vantaa Foods Oy',
    amount: 1_940.5,
    method: 'bank-transfer',
    destination: '•• 0912',
    status: 'failed',
    date: d(3, 17),
    failureReason: 'Account closed',
  },
  {
    id: 'p7',
    payee: 'Lumen Studio',
    amount: 450,
    method: 'instant',
    destination: '•• 2264',
    status: 'cancelled',
    date: d(3, 4),
  },
];

const bill = (id: string, month: number, day: number, amount: number) => ({
  id,
  due: d(month, day),
  amount,
});

export const VENDORS: Vendor[] = [
  {
    id: 'v1',
    name: 'Barrett Furniture Ltd',
    contact: 'Conor Barrett',
    termsDays: 30,
    status: 'active',
    bills: [bill('b1', 3, 12, 2_400), bill('b2', 3, 21, 4_200)],
    lastPayment: { date: d(2, 27), amount: 3_600 },
  },
  {
    id: 'v2',
    name: 'Kingsway Estates',
    contact: 'Fiona Reid',
    termsDays: 14,
    status: 'active',
    bills: [bill('b3', 3, 24, 2_850)],
    lastPayment: { date: d(3, 2), amount: 2_850 },
  },
  {
    id: 'v3',
    name: 'Okapi Translations',
    contact: 'Ana Ferreira',
    termsDays: 14,
    status: 'on-hold',
    bills: [bill('b4', 3, 5, 310)],
    lastPayment: { date: d(2, 14), amount: 540 },
  },
  {
    id: 'v4',
    name: 'Nordwind Logistik GmbH',
    contact: 'Katrin Vogel',
    termsDays: 60,
    status: 'active',
    bills: [bill('b5', 4, 20, 3_120)],
    lastPayment: { date: d(3, 16), amount: 3_120 },
  },
  {
    id: 'v5',
    name: 'Calder Paper Mills',
    contact: 'Niall Keane',
    termsDays: 30,
    status: 'active',
    bills: [bill('b6', 4, 2, 1_145.6)],
  },
  {
    id: 'v6',
    name: 'Copperleaf Catering',
    termsDays: 14,
    status: 'archived',
    bills: [],
    lastPayment: { date: d(11, 12, 2025), amount: 420 },
  },
];

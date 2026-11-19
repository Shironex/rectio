/** The sample report the landing page shows: March 2026, one traveller, euro amounts. */
export const CURRENCY = 'EUR';
export const LOCALE = 'en-IE';

export type Status = 'review' | 'receipt' | 'approved' | 'rejected';

/** Words carry the state; the badge tone only reinforces it. */
export const STATUS: Record<
  Status,
  { label: string; tone: 'info' | 'warning' | 'positive' | 'negative' }
> = {
  review: { label: 'In review', tone: 'info' },
  receipt: { label: 'Receipt missing', tone: 'warning' },
  approved: { label: 'Approved', tone: 'positive' },
  rejected: { label: 'Rejected', tone: 'negative' },
};

export interface Line {
  id: string;
  merchant: string;
  note: string;
  category: string;
  amount: number;
  status: Status;
}

export const LINES: Line[] = [
  {
    id: 'l1',
    merchant: 'Lufthansa',
    note: 'FRA to WAW, return',
    category: 'Flights',
    amount: 412.8,
    status: 'approved',
  },
  {
    id: 'l2',
    merchant: 'Hotel Bristol',
    note: 'Two nights',
    category: 'Hotels',
    amount: 538,
    status: 'approved',
  },
  {
    id: 'l3',
    merchant: 'Atelier Restaurant',
    note: 'Client, 3 guests',
    category: 'Client meals',
    amount: 214.5,
    status: 'review',
  },
  {
    id: 'l4',
    merchant: 'Hotel Bristol',
    note: 'Refund, late checkout',
    category: 'Hotels',
    amount: -61,
    status: 'approved',
  },
];

/** Lines that arrive while the visitor watches, or when they press Add expense. */
export const ARRIVING: Line[] = [
  {
    id: 'a1',
    merchant: 'Deutsche Bahn',
    note: 'Warsaw to Berlin',
    category: 'Rail',
    amount: 89.9,
    status: 'receipt',
  },
  {
    id: 'a2',
    merchant: 'Figma',
    note: 'Team seat, March',
    category: 'Software',
    amount: 75,
    status: 'review',
  },
  {
    id: 'a3',
    merchant: 'Café Einstein',
    note: 'Breakfast meeting',
    category: 'Client meals',
    amount: 38.5,
    status: 'review',
  },
];

export const sum = (lines: { amount: number }[]) => lines.reduce((t, l) => t + l.amount, 0);

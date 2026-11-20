export interface Category {
  value: string;
  label: string;
  group: 'Travel' | 'Meals' | 'Tools';
}

export const CATEGORIES: Category[] = [
  { value: 'flights', label: 'Flights', group: 'Travel' },
  { value: 'rail', label: 'Rail', group: 'Travel' },
  { value: 'travel', label: 'Hotels', group: 'Travel' },
  { value: 'meals', label: 'Client meals', group: 'Meals' },
  { value: 'software', label: 'Software', group: 'Tools' },
  { value: 'office', label: 'Office supplies', group: 'Tools' },
];

export type ExpenseStatus = 'draft' | 'review' | 'receipt' | 'approved' | 'rejected';

/** Each state's words and badge tone. The words carry the meaning; the tone only reinforces it. */
export const STATUSES: Record<
  ExpenseStatus,
  { label: string; tone: 'neutral' | 'info' | 'warning' | 'positive' | 'negative' }
> = {
  draft: { label: 'Draft', tone: 'neutral' },
  review: { label: 'In review', tone: 'info' },
  receipt: { label: 'Receipt missing', tone: 'warning' },
  approved: { label: 'Approved', tone: 'positive' },
  rejected: { label: 'Rejected', tone: 'negative' },
};

export interface Expense {
  id: string;
  date: Date;
  merchant: string;
  category: string;
  note?: string | undefined;
  amount: number;
  status: ExpenseStatus;
}

const march = (day: number) => new Date(2026, 2, day);

export const EXPENSES: Expense[] = [
  {
    id: 'e1',
    date: march(3),
    merchant: 'Lufthansa',
    category: 'flights',
    note: 'FRA to DUB, return',
    amount: 412.8,
    status: 'approved',
  },
  {
    id: 'e2',
    date: march(4),
    merchant: 'Hotel Bristol',
    category: 'travel',
    note: 'Two nights',
    amount: 538,
    status: 'approved',
  },
  {
    id: 'e3',
    date: march(5),
    merchant: 'Figma',
    category: 'software',
    amount: 75,
    status: 'review',
  },
  {
    id: 'e4',
    date: march(7),
    merchant: 'Deutsche Bahn',
    category: 'rail',
    amount: 89.9,
    status: 'receipt',
  },
  {
    id: 'e5',
    date: march(11),
    merchant: 'Atelier Restaurant',
    category: 'meals',
    note: 'Client, 3 guests',
    amount: 214.5,
    status: 'review',
  },
  {
    id: 'e6',
    date: march(14),
    merchant: 'Linear',
    category: 'software',
    amount: 1080,
    status: 'rejected',
  },
  {
    id: 'e7',
    date: march(18),
    merchant: 'Hotel Bristol',
    category: 'travel',
    note: 'Refund, late checkout',
    amount: -61,
    status: 'approved',
  },
];

export const categoryLabel = (value: string) =>
  CATEGORIES.find((c) => c.value === value)?.label ?? value;

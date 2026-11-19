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

export interface Expense {
  id: string;
  /** Display string: the playground has no date logic. */
  date: string;
  merchant: string;
  category: string;
  note?: string | undefined;
  amount: number;
}

export const EXPENSES: Expense[] = [
  {
    id: 'e1',
    date: '3 Mar',
    merchant: 'Lufthansa',
    category: 'flights',
    note: 'FRA to WAW, return',
    amount: 412.8,
  },
  {
    id: 'e2',
    date: '4 Mar',
    merchant: 'Hotel Bristol',
    category: 'travel',
    note: 'Two nights',
    amount: 538,
  },
  { id: 'e3', date: '5 Mar', merchant: 'Figma', category: 'software', amount: 75 },
  { id: 'e4', date: '7 Mar', merchant: 'Deutsche Bahn', category: 'rail', amount: 89.9 },
  {
    id: 'e5',
    date: '11 Mar',
    merchant: 'Atelier Restaurant',
    category: 'meals',
    note: 'Client, 3 guests',
    amount: 214.5,
  },
  { id: 'e6', date: '14 Mar', merchant: 'Linear', category: 'software', amount: 1080 },
  {
    id: 'e7',
    date: '18 Mar',
    merchant: 'Hotel Bristol',
    category: 'travel',
    note: 'Refund, late checkout',
    amount: -61,
  },
];

export const categoryLabel = (value: string) =>
  CATEGORIES.find((c) => c.value === value)?.label ?? value;

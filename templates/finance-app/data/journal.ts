import { documentTotals, toMinor, type JournalLine, type LedgerAccount } from '@rectio/blocks';

import { CURRENCY, TODAY, day } from './company';
import { EXPENSES, type ExpenseCategory } from './expenses';
import { INVOICE_RECORDS } from './invoice-records';

export const ACCOUNTS: readonly LedgerAccount[] = [
  { code: '1000', name: 'Bank, AIB current account', normal: 'debit' },
  { code: '1100', name: 'Trade debtors', normal: 'debit' },
  { code: '1200', name: 'Prepayments', normal: 'debit' },
  { code: '2100', name: 'Trade creditors', normal: 'credit' },
  { code: '2200', name: 'VAT', normal: 'credit' },
  { code: '2300', name: 'Employee expense claims', normal: 'credit' },
  { code: '4000', name: 'Licence revenue', normal: 'credit' },
  { code: '4100', name: 'Services revenue', normal: 'credit' },
  { code: '4200', name: 'Support revenue', normal: 'credit' },
  { code: '5000', name: 'Cloud hosting', normal: 'debit' },
  { code: '6100', name: 'Software subscriptions', normal: 'debit' },
  { code: '6200', name: 'Travel and accommodation', normal: 'debit' },
  { code: '6300', name: 'Rent and office', normal: 'debit' },
  { code: '6400', name: 'Meals and entertainment', normal: 'debit' },
  { code: '6500', name: 'Training', normal: 'debit' },
  { code: '6600', name: 'Equipment', normal: 'debit' },
];

/** Balances on 1 November, the start of the period the journal shows. */
export const OPENING_BALANCES: Readonly<Record<string, number>> = {
  '1000': 148_215.6,
  '1100': 96_934.2,
  '2100': -12_480.35,
  '2200': -8_402.11,
  '2300': -1_964.5,
};

export const JOURNAL_PERIOD = 'November 2026';

type Posting = [account: string, debit: number, credit: number];

interface Entry {
  id: string;
  date: Date;
  reference: string;
  description: string;
  postings: Posting[];
}

const cents = (amount: number) => toMinor(amount, CURRENCY);
const major = (amountCents: number) => amountCents / 100;

function revenueAccount(description: string): string {
  if (description.includes('licence') || description.includes('module')) return '4000';
  if (description.includes('support')) return '4200';
  return '4100';
}

const EXPENSE_ACCOUNT: Record<ExpenseCategory, string> = {
  Travel: '6200',
  Accommodation: '6200',
  Meals: '6400',
  'Client entertainment': '6400',
  Software: '6100',
  Equipment: '6600',
  Training: '6500',
  Office: '6300',
};

const inPeriod = (date: Date) =>
  date.getTime() >= day(2026, 11, 1).getTime() && date.getTime() <= TODAY.getTime();

function invoiceEntries(): Entry[] {
  const entries: Entry[] = [];
  for (const { document, customer } of INVOICE_RECORDS) {
    if (document.status === 'draft') continue;
    if (inPeriod(document.issued) && document.status !== 'void') {
      // The invoice's own totals: VAT per rate on the summed nets, as printed on the invoice, so
      // the receivable posted here is the invoice total to the cent.
      const totals = documentTotals(document.lines, [], CURRENCY);
      const byAccount = new Map<string, number>();
      document.lines.forEach((line, index) => {
        const account = revenueAccount(line.description.toLowerCase());
        byAccount.set(account, (byAccount.get(account) ?? 0) + cents(totals.lineNets[index] ?? 0));
      });
      const net = cents(totals.subtotal);
      const vat = cents(totals.vatTotal);
      entries.push({
        id: `j-${document.number}`,
        date: document.issued,
        reference: document.number.replace('2026-', ''),
        description: `Invoice to ${customer.name}`,
        postings: [
          ['1100', major(net + vat), 0],
          ...[...byAccount].map(([account, amount]): Posting => [account, 0, major(amount)]),
          ...(vat > 0 ? [['2200', 0, major(vat)] as Posting] : []),
        ],
      });
    }
    for (const payment of document.payments ?? []) {
      if (!inPeriod(payment.date)) continue;
      entries.push({
        id: `j-${payment.id}`,
        date: payment.date,
        reference: `BNK-${document.number.slice(-4)}`,
        description: `Payment from ${customer.name}`,
        postings: [
          ['1000', payment.amount, 0],
          ['1100', 0, payment.amount],
        ],
      });
    }
  }
  return entries;
}

function expenseEntries(): Entry[] {
  return EXPENSES.requests
    .filter((r) => r.status === 'approved' && inPeriod(r.date))
    .map((r) => ({
      id: `j-${r.id}`,
      date: r.date,
      reference: `EXP-${r.id.slice(1).padStart(4, '0')}`,
      description: `${r.merchant}, ${r.employee}`,
      postings: [
        [EXPENSE_ACCOUNT[r.category as ExpenseCategory], r.amount, 0],
        ['2300', 0, r.amount],
      ],
    }));
}

const RECURRING: Entry[] = [
  {
    id: 'j-rent',
    date: day(2026, 11, 1),
    reference: 'DD-1101',
    description: 'Office rent, Harcourt Street',
    postings: [
      ['6300', 4_200, 0],
      ['1000', 0, 4_200],
    ],
  },
  {
    id: 'j-aws',
    date: day(2026, 11, 3),
    reference: 'BILL-3318',
    description: 'Amazon Web Services, October usage',
    postings: [
      ['5000', 3_184.22, 0],
      ['2100', 0, 3_184.22],
    ],
  },
  {
    id: 'j-google',
    date: day(2026, 11, 4),
    reference: 'BILL-3321',
    description: 'Google Workspace, 24 users',
    postings: [
      ['6100', 331.2, 0],
      ['2100', 0, 331.2],
    ],
  },
  {
    id: 'j-insurance',
    date: day(2026, 11, 6),
    reference: 'BILL-3324',
    description: 'Professional indemnity insurance, 12 months',
    postings: [
      ['1200', 5_640, 0],
      ['2100', 0, 5_640],
    ],
  },
  {
    id: 'j-vat',
    date: day(2026, 11, 10),
    reference: 'ROS-0926',
    description: 'VAT return, September and October',
    postings: [
      ['2200', 8_402.11, 0],
      ['1000', 0, 8_402.11],
    ],
  },
  {
    id: 'j-claims',
    date: day(2026, 11, 13),
    reference: 'PAY-1113',
    description: 'Expense claims paid, October run',
    postings: [
      ['2300', 1_964.5, 0],
      ['1000', 0, 1_964.5],
    ],
  },
  {
    id: 'j-creditors',
    date: day(2026, 11, 16),
    reference: 'PAY-1116',
    description: 'Supplier payment run',
    postings: [
      ['2100', 9_296.13, 0],
      ['1000', 0, 9_296.13],
    ],
  },
];

function toLines(entries: Entry[]): JournalLine[] {
  return entries
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .flatMap((entry) =>
      entry.postings.map(([accountCode, debit, credit], index) => ({
        id: `${entry.id}-${String(index)}`,
        entryId: entry.id,
        date: entry.date,
        reference: entry.reference,
        description: entry.description,
        accountCode,
        debit,
        credit,
      })),
    );
}

export const JOURNAL: readonly JournalLine[] = toLines([
  ...RECURRING,
  ...invoiceEntries(),
  ...expenseEntries(),
]);

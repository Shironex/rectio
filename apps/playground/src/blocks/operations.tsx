import * as plain from '@rectio/blocks';
import type { BookEntry, Payout, ReconciliationMatch, StatementLine, Vendor } from '@rectio/blocks';
import { Button } from '@rectio/ui';
import { useReducer, useState, type ReactNode } from 'react';

import type { Locale } from './data';
import { TODAY } from './data';
import { bankReconciliationPl } from './pl/bank-reconciliation';
import { payoutsPl } from './pl/payouts';
import { vendorsListPl } from './pl/vendors-list';

/**
 * The operations blocks (bank reconciliation, payouts, vendors) with their sample data, kept apart
 * from the blocks page so it only names them. Sample data only: the blocks take any data of these
 * shapes. The demo's today is 19 March 2026.
 */
export const OPERATIONS_BLOCKS = ['bank-reconciliation', 'payouts', 'vendors-list'] as const;
export type OperationsBlock = (typeof OPERATIONS_BLOCKS)[number];

export function isOperationsBlock(name: string): name is OperationsBlock {
  return (OPERATIONS_BLOCKS as readonly string[]).includes(name);
}

export type OperationsBlocks = Pick<typeof plain, 'BankReconciliation' | 'Payouts' | 'VendorsList'>;

const scale = (amount: number, rate: number) => Math.round(amount * rate * 100) / 100;
const d = (month: number, day: number, year = 2026) => new Date(year, month - 1, day);

/** [id, month, day, en, pl, reference, amount] */
type Row = readonly [string, number, number, string, string, string | undefined, number];

const STATEMENT: readonly Row[] = [
  ['s01', 3, 2, 'Kestrel Analytics Ltd', 'Kestrel Analytics Ltd', 'INV-2026-0121', 6_240],
  ['s02', 3, 3, 'Card processing fee', 'Opłata za obsługę kart', undefined, -38.4],
  ['s03', 3, 5, 'Payroll, March', 'Wynagrodzenia, marzec', 'PAY-03', -18_400],
  ['s04', 3, 6, 'Nordwind Logistik GmbH', 'Nordwind Logistik GmbH', 'INV-2026-0118', 18_450],
  ['s05', 3, 9, 'Atelier Lune SARL', 'Atelier Lune SARL', 'INV 2026 0127', 3_915],
  ['s06', 3, 10, 'Kingsway Estates, rent', 'Kingsway Estates, czynsz', 'RENT-0326', -2_850],
  ['s07', 3, 12, 'Atlas Cloud Services', 'Atlas Cloud Services', undefined, -1_264.18],
  ['s08', 3, 13, 'Interest', 'Odsetki', undefined, 4.12],
  ['s09', 3, 16, 'Vantaa Foods Oy', 'Vantaa Foods Oy', 'INV-2026-0131', 27_300],
  ['s10', 3, 17, 'VAT payment', 'Przelew VAT', 'VAT-Q4', -9_412.6],
];

const BOOK: readonly Row[] = [
  ['b01', 3, 1, 'Receipt, Kestrel Analytics', 'Wpłata, Kestrel Analytics', 'INV-2026-0121', 6_240],
  ['b03', 3, 4, 'Salaries, March', 'Wynagrodzenia za marzec', undefined, -18_400],
  ['b04', 3, 6, 'Receipt, Nordwind Logistik', 'Wpłata, Nordwind Logistik', 'INV-2026-0118', 18_450],
  ['b05', 3, 2, 'Receipt, Atelier Lune', 'Wpłata, Atelier Lune', 'INV-2026-0127', 3_915],
  ['b06', 3, 10, 'Rent, Kingsway office', 'Czynsz, biuro Kingsway', 'RENT-0326', -2_850],
  ['b07', 3, 11, 'Hosting, March', 'Hosting, marzec', undefined, -1_264.18],
  ['b09', 3, 16, 'Receipt, Vantaa Foods', 'Wpłata, Vantaa Foods', 'INV-2026-0131', 27_300],
  ['b10', 3, 17, 'VAT return, Q4', 'Deklaracja VAT, IV kw.', 'VAT-Q4', -9_412.6],
  ['b12', 3, 14, 'Cheque 000142', 'Czek 000142', '000142', -760],
  ['b11', 3, 18, 'Supplier payment, Borowik Meble', 'Płatność, Borowik Meble', 'BILL-0884', -4_200],
];

const toLines = (rows: readonly Row[], rate: number, pl: boolean) =>
  rows.map(([id, month, day, en, polish, reference, amount]) => ({
    id,
    date: d(month, day),
    description: pl ? polish : en,
    ...(reference === undefined ? {} : { reference }),
    amount: scale(amount, rate),
  }));

export function statementLines(rate: number, pl: boolean): StatementLine[] {
  return toLines(STATEMENT, rate, pl);
}

export function bookEntries(rate: number, pl: boolean): BookEntry[] {
  return toLines(BOOK, rate, pl);
}

const INITIAL_MATCHES: readonly ReconciliationMatch[] = [
  { bankId: 's04', bookId: 'b04' },
  { bankId: 's06', bookId: 'b06' },
  { bankId: 's09', bookId: 'b09' },
  { bankId: 's10', bookId: 'b10' },
];

/**
 * The balances agree once the card fee and the interest reach the books and the cheque and the
 * supplier payment clear the bank: the difference is exactly what the unmatched items explain.
 */
function balances(rate: number) {
  const book = scale(48_310.55, rate);
  const unmatched = (rows: readonly Row[], ids: readonly string[]) =>
    plain.sumMoney(
      rows.filter((r) => ids.includes(r[0])).map((r) => scale(r[6], rate)),
      'EUR',
    );
  const statement = plain.sumMoney(
    [book, unmatched(STATEMENT, ['s02', 's08']), -unmatched(BOOK, ['b11', 'b12'])],
    'EUR',
  );
  return { book, statement };
}

const PAYOUTS: readonly [
  string,
  string,
  number,
  Payout['method'],
  Payout['status'],
  number,
  number,
  string | undefined,
  readonly [string, string] | undefined,
][] = [
  [
    'p01',
    'Borowik Meble sp. z o.o.',
    4_200,
    'bank-transfer',
    'scheduled',
    3,
    21,
    '•• 7730',
    undefined,
  ],
  ['p02', 'Kingsway Estates', 2_850, 'bank-transfer', 'scheduled', 3, 24, '•• 1029', undefined],
  ['p03', 'Lumen Studio', 1_480, 'instant', 'scheduled', 4, 2, '•• 2264', undefined],
  ['p04', 'Atlas Cloud Services', 1_264.18, 'card', 'in-transit', 3, 20, '•• 4417', undefined],
  ['p05', 'Okapi Translations', 620, 'instant', 'in-transit', 3, 20, '•• 5531', undefined],
  ['p06', 'Nordwind Logistik GmbH', 3_120, 'bank-transfer', 'paid', 3, 16, '•• 8802', undefined],
  ['p07', 'Studio Mirela Kowal', 980, 'wallet', 'paid', 3, 9, undefined, undefined],
  ['p08', 'Kingsway Estates', 2_850, 'bank-transfer', 'paid', 3, 2, '•• 1029', undefined],
  [
    'p09',
    'Vantaa Foods Oy',
    1_940.5,
    'bank-transfer',
    'failed',
    3,
    17,
    '•• 0912',
    ['Account closed', 'Rachunek zamknięty'],
  ],
  [
    'p10',
    'Okapi Translations',
    310,
    'card',
    'failed',
    3,
    18,
    '•• 5531',
    ['Card expired', 'Karta wygasła'],
  ],
  ['p11', 'Lumen Studio', 450, 'instant', 'cancelled', 3, 4, '•• 2264', undefined],
];

export function payouts(rate: number, pl: boolean): Payout[] {
  return PAYOUTS.map(([id, payee, amount, method, status, month, day, destination, reason]) => ({
    id,
    payee,
    amount: scale(amount, rate),
    method,
    status,
    date: d(month, day),
    ...(destination === undefined ? {} : { destination }),
    ...(reason === undefined ? {} : { failureReason: pl ? reason[1] : reason[0] }),
  }));
}

export function vendors(rate: number): Vendor[] {
  const bill = (id: string, month: number, day: number, amount: number) => ({
    id,
    due: d(month, day),
    amount: scale(amount, rate),
  });
  const paid = (month: number, day: number, amount: number, year = 2026) => ({
    date: d(month, day, year),
    amount: scale(amount, rate),
  });
  return [
    {
      id: 'v01',
      name: 'Borowik Meble sp. z o.o.',
      contact: 'Tomasz Borowik',
      termsDays: 30,
      status: 'active',
      bills: [bill('b1', 3, 12, 2_400), bill('b2', 3, 21, 4_200)],
      lastPayment: paid(2, 27, 3_600),
    },
    {
      id: 'v02',
      name: 'Kingsway Estates',
      contact: 'Fiona Reid',
      termsDays: 14,
      status: 'active',
      bills: [bill('b3', 3, 24, 2_850)],
      lastPayment: paid(3, 2, 2_850),
    },
    {
      id: 'v03',
      name: 'Atlas Cloud Services',
      contact: 'billing@atlascloud.example',
      termsDays: 30,
      status: 'active',
      bills: [bill('b4', 4, 11, 1_264.18)],
      lastPayment: paid(2, 11, 1_198.4),
    },
    {
      id: 'v04',
      name: 'Okapi Translations',
      contact: 'Ana Ferreira',
      termsDays: 14,
      status: 'on-hold',
      bills: [bill('b5', 3, 5, 310), bill('b6', 3, 15, 620)],
      lastPayment: paid(2, 14, 540),
    },
    {
      id: 'v05',
      name: 'Lumen Studio',
      contact: 'Jonas Berg',
      termsDays: 30,
      status: 'active',
      bills: [bill('b7', 4, 2, 1_480)],
      lastPayment: paid(1, 30, 1_200),
    },
    {
      id: 'v06',
      name: 'Nordwind Logistik GmbH',
      contact: 'Katrin Vogel',
      termsDays: 60,
      status: 'active',
      bills: [bill('b8', 4, 20, 3_120), bill('b9', 5, 4, 7_850)],
      lastPayment: paid(3, 16, 3_120),
    },
    {
      id: 'v07',
      name: 'Łódzkie Zakłady Papiernicze',
      contact: 'Agnieszka Wróbel',
      termsDays: 30,
      status: 'active',
      bills: [bill('b10', 2, 28, 1_145.6)],
      lastPayment: paid(1, 29, 980),
    },
    {
      id: 'v08',
      name: 'Studio Mirela Kowal',
      contact: 'Mirela Kowal',
      termsDays: 14,
      status: 'active',
      bills: [],
      lastPayment: paid(3, 9, 980),
    },
    {
      id: 'v09',
      name: 'Vantaa Foods Oy',
      contact: 'Mikko Laine',
      termsDays: 30,
      status: 'on-hold',
      bills: [bill('b11', 3, 26, 1_940.5)],
    },
    {
      id: 'v10',
      name: 'Copperleaf Catering',
      termsDays: 14,
      status: 'archived',
      bills: [],
      lastPayment: paid(11, 12, 420, 2025),
    },
  ];
}

const EMPTY_ACTION: Record<OperationsBlock, readonly [string, string]> = {
  'bank-reconciliation': ['Import statement', 'Importuj wyciąg'],
  payouts: ['Schedule payout', 'Zaplanuj wypłatę'],
  'vendors-list': ['Import vendors', 'Importuj dostawców'],
};

export function renderOperations(
  name: OperationsBlock,
  blocks: OperationsBlocks,
  locale: Locale,
  empty = false,
): ReactNode {
  const pl = locale.id === 'pl-PL';
  const common = { currency: locale.currency, locale: locale.locale };
  const action = (
    <Button variant={name === 'vendors-list' ? 'secondary' : 'primary'}>
      {EMPTY_ACTION[name][pl ? 1 : 0]}
    </Button>
  );
  switch (name) {
    case 'bank-reconciliation':
      return <Reconciliation blocks={blocks} locale={locale} empty={empty} action={action} />;
    case 'payouts':
      return <PayoutsDemo blocks={blocks} locale={locale} empty={empty} action={action} />;
    case 'vendors-list':
      return (
        <blocks.VendorsList
          {...common}
          {...(pl ? { messages: vendorsListPl } : {})}
          vendors={empty ? [] : vendors(locale.rate)}
          today={TODAY}
          onOpenVendor={() => undefined}
          onAddVendor={() => undefined}
          emptyAction={action}
        />
      );
  }
}

/** The reconciliation block holds no pairs itself: the app keeps them, here with the exported reducer. */
function Reconciliation({
  blocks,
  locale,
  empty,
  action,
}: {
  blocks: OperationsBlocks;
  locale: Locale;
  empty: boolean;
  action: ReactNode;
}) {
  const pl = locale.id === 'pl-PL';
  const [matches, dispatch] = useReducer(plain.reconciliationReducer, INITIAL_MATCHES);
  const { book, statement } = balances(locale.rate);
  return (
    <blocks.BankReconciliation
      currency={locale.currency}
      locale={locale.locale}
      {...(pl ? { messages: bankReconciliationPl } : {})}
      statement={empty ? [] : statementLines(locale.rate, pl)}
      book={empty ? [] : bookEntries(locale.rate, pl)}
      matches={empty ? [] : matches}
      statementBalance={empty ? 0 : statement}
      bookBalance={empty ? 0 : book}
      account={pl ? 'Rachunek bieżący •• 4821' : 'Business current •• 4821'}
      period={pl ? 'marzec 2026' : 'March 2026'}
      onMatch={(bankId, bookId) => {
        dispatch({ type: 'match', bankId, bookId });
      }}
      onUnmatch={(bankId) => {
        dispatch({ type: 'unmatch', bankId });
      }}
      onReconcile={() => undefined}
      onCreateEntry={() => undefined}
      emptyAction={action}
    />
  );
}

/** Retry flips a failed payout back to scheduled for tomorrow, after a short wait. */
function PayoutsDemo({
  blocks,
  locale,
  empty,
  action,
}: {
  blocks: OperationsBlocks;
  locale: Locale;
  empty: boolean;
  action: ReactNode;
}) {
  const pl = locale.id === 'pl-PL';
  const [list, setList] = useState(() => payouts(locale.rate, pl));
  const [retrying, setRetrying] = useState<readonly string[]>([]);
  return (
    <blocks.Payouts
      currency={locale.currency}
      locale={locale.locale}
      {...(pl ? { messages: payoutsPl } : {})}
      payouts={empty ? [] : list}
      today={TODAY}
      retrying={retrying}
      onRetry={(payout) => {
        setRetrying((ids) => [...ids, payout.id]);
        window.setTimeout(() => {
          setRetrying((ids) => ids.filter((id) => id !== payout.id));
          setList((all) =>
            all.map((p) =>
              p.id === payout.id
                ? {
                    id: p.id,
                    payee: p.payee,
                    amount: p.amount,
                    method: p.method,
                    status: 'scheduled',
                    date: d(3, 20),
                  }
                : p,
            ),
          );
        }, 900);
      }}
      onOpenPayout={() => undefined}
      emptyAction={action}
    />
  );
}

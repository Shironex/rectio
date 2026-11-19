import type {
  ApprovalState,
  BudgetLine,
  CashFlowPoint,
  Kpi,
  Receivable,
  InvoiceDocument,
  InvoiceSummary,
  JournalLine,
  LedgerAccount,
} from '@rectio/blocks';

/** Sample data only: the blocks take any data of these shapes. The demo's today is 19 March 2026. */
export const TODAY = new Date(2026, 2, 19);

const d = (month: number, day: number, year = 2026) => new Date(year, month - 1, day);

export interface Locale {
  id: 'en-GB' | 'pl-PL';
  locale: string;
  currency: string;
  /** Converts the EUR sample figures to the shown currency, so both read as plausible. */
  rate: number;
}

export const LOCALES: Record<Locale['id'], Locale> = {
  'en-GB': { id: 'en-GB', locale: 'en-GB', currency: 'EUR', rate: 1 },
  'pl-PL': { id: 'pl-PL', locale: 'pl-PL', currency: 'PLN', rate: 4.27 },
};

const scale = (amount: number, rate: number) => Math.round(amount * rate * 100) / 100;

/** The words of the sample data are user content, so they follow the locale like a real company's. */
const pick = (pl: boolean, en: string, pol: string) => (pl ? pol : en);

/** The page's own words around the blocks: periods, the comparison and the dashboard header. */
export function copy(locale: Locale) {
  const pl = locale.id === 'pl-PL';
  return {
    month: pick(pl, 'March 2026', 'marzec 2026'),
    quarter: pick(pl, 'Q1 2026', 'I kwartał 2026'),
    quarterProgress: pick(pl, 'Q1 2026, 11 of 13 weeks', 'I kwartał 2026, 11 z 13 tygodni'),
    comparison: pick(pl, 'vs February', 'wobec lutego'),
    kpiLabel: pick(pl, 'Key figures, March 2026', 'Kluczowe wskaźniki, marzec 2026'),
    dashboardTitle: pick(pl, 'Finance, March 2026', 'Finanse, marzec 2026'),
  };
}

const INVOICES: InvoiceSummary[] = [
  {
    id: 'i01',
    number: 'INV-2026-0118',
    customer: 'Nordwind Logistik GmbH',
    issued: d(1, 12),
    due: d(2, 11),
    total: 18_450,
    status: 'paid',
  },
  {
    id: 'i02',
    number: 'INV-2026-0121',
    customer: 'Kestrel Analytics Ltd',
    issued: d(1, 20),
    due: d(2, 19),
    total: 6_240,
    status: 'sent',
  },
  {
    id: 'i03',
    number: 'INV-2026-0124',
    customer: 'Borowik Meble sp. z o.o.',
    issued: d(1, 28),
    due: d(2, 27),
    total: 11_872.5,
    amountPaid: 5_000,
    status: 'sent',
  },
  {
    id: 'i04',
    number: 'INV-2026-0127',
    customer: 'Atelier Lune SARL',
    issued: d(2, 3),
    due: d(3, 5),
    total: 3_915,
    status: 'sent',
  },
  {
    id: 'i05',
    number: 'INV-2026-0131',
    customer: 'Vantaa Foods Oy',
    issued: d(2, 10),
    due: d(3, 12),
    total: 27_300,
    status: 'paid',
  },
  {
    id: 'i06',
    number: 'INV-2026-0133',
    customer: 'Cobham Rail Services',
    issued: d(2, 17),
    due: d(3, 19),
    total: 9_480,
    status: 'sent',
  },
  {
    id: 'i07',
    number: 'INV-2026-0136',
    customer: 'Pardo & Hijos SL',
    issued: d(2, 24),
    due: d(3, 26),
    total: 4_128.4,
    status: 'sent',
  },
  {
    id: 'i08',
    number: 'INV-2026-0139',
    customer: 'Greywell Partners LLP',
    issued: d(3, 2),
    due: d(4, 1),
    total: 15_600,
    status: 'sent',
  },
  {
    id: 'i09',
    number: 'INV-2026-0141',
    customer: 'Nordwind Logistik GmbH',
    issued: d(3, 6),
    due: d(4, 5),
    total: 21_034.8,
    status: 'paid',
  },
  {
    id: 'i10',
    number: 'INV-2026-0142',
    customer: 'Kestrel Analytics Ltd',
    issued: d(3, 9),
    due: d(4, 8),
    total: 7_380,
    status: 'sent',
  },
  {
    id: 'i11',
    number: 'INV-2026-0144',
    customer: 'Halvorsen Marine AS',
    issued: d(3, 12),
    due: d(4, 11),
    total: 2_460,
    status: 'void',
  },
  {
    id: 'i12',
    number: 'INV-2026-0145',
    customer: 'Atelier Lune SARL',
    issued: d(3, 17),
    due: d(4, 16),
    total: 5_166,
    status: 'draft',
  },
];

export function invoices(rate: number): InvoiceSummary[] {
  return INVOICES.map((invoice) => ({
    ...invoice,
    total: scale(invoice.total, rate),
    ...(invoice.amountPaid === undefined ? {} : { amountPaid: scale(invoice.amountPaid, rate) }),
  }));
}

export function invoiceDocument(rate: number, pl = false): InvoiceDocument {
  return {
    number: 'INV-2026-0124',
    status: 'sent',
    issued: d(1, 28),
    due: d(2, 27),
    reference: 'PO 4471-BM',
    seller: {
      name: 'Fernhill Systems Ltd',
      address: ['14 Harcourt Street', 'Dublin D02 YX88', pick(pl, 'Ireland', 'Irlandia')],
      taxId: 'IE 3412876LH',
    },
    buyer: {
      name: 'Borowik Meble sp. z o.o.',
      address: ['ul. Garbary 48', '61-869 Poznań', pick(pl, 'Poland', 'Polska')],
      taxId: 'PL 7792471305',
    },
    lines: [
      {
        id: 'l1',
        description: pick(
          pl,
          'Warehouse scheduling licence',
          'Licencja na harmonogramowanie magazynu',
        ),
        detail: pick(
          pl,
          'Annual, 40 seats, Feb 2026 to Jan 2027',
          'Roczna, 40 stanowisk, luty 2026 do styczeń 2027',
        ),
        quantity: 40,
        unit: pick(pl, 'seats', 'stan.'),
        unitPrice: scale(186, rate),
        taxRate: 0.23,
      },
      {
        id: 'l2',
        description: pick(pl, 'Integration with the ERP', 'Integracja z systemem ERP'),
        detail: pick(
          pl,
          'Order and stock sync, fixed scope',
          'Synchronizacja zamówień i stanów, stały zakres',
        ),
        quantity: 1,
        unitPrice: scale(1_450, rate),
        taxRate: 0.23,
      },
      {
        id: 'l3',
        description: pick(pl, 'On-site training', 'Szkolenie na miejscu'),
        detail: pick(pl, 'Poznań, two days', 'Poznań, dwa dni'),
        quantity: 14,
        unit: pick(pl, 'h', 'godz.'),
        unitPrice: scale(95, rate),
        taxRate: 0.23,
      },
      {
        id: 'l4',
        description: pick(pl, 'Printed operator guides', 'Drukowane instrukcje dla operatorów'),
        quantity: 25,
        unit: pick(pl, 'pcs', 'szt.'),
        unitPrice: scale(12.9, rate),
        taxRate: 0.08,
      },
    ],
    payments: [
      {
        id: 'p1',
        date: d(2, 20),
        amount: scale(5_000, rate),
        method: pick(pl, 'Bank transfer, SEPA', 'Przelew bankowy, SEPA'),
      },
    ],
    notes: pick(
      pl,
      'Pay by bank transfer to IE29 AIBK 9311 5212 3456 78, quoting the invoice number.',
      'Płatność przelewem na rachunek IE29 AIBK 9311 5212 3456 78, z numerem faktury w tytule.',
    ),
  };
}

const ACCOUNT_ROWS: [code: string, en: string, pl: string, normal: LedgerAccount['normal']][] = [
  ['1000', 'Bank, current account', 'Bank, rachunek bieżący', 'debit'],
  ['1100', 'Trade debtors', 'Należności z tytułu dostaw i usług', 'debit'],
  ['2100', 'Trade creditors', 'Zobowiązania z tytułu dostaw i usług', 'credit'],
  ['2200', 'VAT payable', 'VAT należny', 'credit'],
  ['4000', 'Licence revenue', 'Przychody z licencji', 'credit'],
  ['4100', 'Services revenue', 'Przychody z usług', 'credit'],
  ['6100', 'Software subscriptions', 'Subskrypcje oprogramowania', 'debit'],
  ['6200', 'Travel', 'Podróże służbowe', 'debit'],
];

export function accounts(pl = false): LedgerAccount[] {
  return ACCOUNT_ROWS.map(([code, en, pol, normal]) => ({ code, name: pick(pl, en, pol), normal }));
}

type Posting = [account: string, debit: number, credit: number];

const ENTRIES: {
  id: string;
  date: Date;
  reference: string;
  description: string;
  descriptionPl: string;
  lines: Posting[];
}[] = [
  {
    id: 'e1',
    date: d(3, 2),
    reference: 'INV-0139',
    description: 'Invoice to Greywell Partners',
    descriptionPl: 'Faktura dla Greywell Partners',
    lines: [
      ['1100', 15_600, 0],
      ['4100', 0, 12_682.93],
      ['2200', 0, 2_917.07],
    ],
  },
  {
    id: 'e2',
    date: d(3, 4),
    reference: 'BNK-0311',
    description: 'Payment from Vantaa Foods',
    descriptionPl: 'Wpłata od Vantaa Foods',
    lines: [
      ['1000', 27_300, 0],
      ['1100', 0, 27_300],
    ],
  },
  {
    id: 'e3',
    date: d(3, 6),
    reference: 'INV-0141',
    description: 'Invoice to Nordwind Logistik',
    descriptionPl: 'Faktura dla Nordwind Logistik',
    lines: [
      ['1100', 21_034.8, 0],
      ['4000', 0, 17_101.46],
      ['2200', 0, 3_933.34],
    ],
  },
  {
    id: 'e4',
    date: d(3, 9),
    reference: 'BILL-2207',
    description: 'Figma, team plan',
    descriptionPl: 'Figma, plan zespołowy',
    lines: [
      ['6100', 540, 0],
      ['2200', 124.2, 0],
      ['2100', 0, 664.2],
    ],
  },
  {
    id: 'e5',
    date: d(3, 11),
    reference: 'EXP-0412',
    description: 'Rail to Poznań, training',
    descriptionPl: 'Przejazd koleją do Poznania, szkolenie',
    lines: [
      ['6200', 286.4, 0],
      ['1000', 0, 286.4],
    ],
  },
  {
    id: 'e6',
    date: d(3, 16),
    reference: 'BNK-0318',
    description: 'Payment from Nordwind Logistik',
    descriptionPl: 'Wpłata od Nordwind Logistik',
    lines: [
      ['1000', 21_034.8, 0],
      ['1100', 0, 21_034.8],
    ],
  },
];

export function journal(rate: number, pl = false): JournalLine[] {
  return ENTRIES.flatMap((entry) => {
    const lines = entry.lines.map(([accountCode, debit, credit]) => ({
      accountCode,
      debit: scale(debit, rate),
      credit: scale(credit, rate),
    }));
    // Converting each posting rounds it on its own; the last line takes the cent, so every
    // converted entry still balances, as the booked one does.
    const cents = (n: number) => Math.round(n * 100);
    const gap = lines.reduce((sum, l) => sum + cents(l.debit) - cents(l.credit), 0);
    const last = lines.at(-1);
    if (last !== undefined && gap !== 0) {
      if (last.credit > 0) last.credit = (cents(last.credit) + gap) / 100;
      else last.debit = (cents(last.debit) - gap) / 100;
    }
    return lines.map((line, index) => ({
      id: `${entry.id}-${String(index)}`,
      entryId: entry.id,
      date: entry.date,
      reference: entry.reference,
      description: pick(pl, entry.description, entry.descriptionPl),
      ...line,
    }));
  });
}

export function openingBalances(rate: number): Record<string, number> {
  return {
    '1000': scale(48_215.6, rate),
    '1100': scale(66_934.2, rate),
    '2200': scale(-8_402.11, rate),
  };
}

const FLOW: [month: number, year: number, inflow: number, outflow: number][] = [
  [4, 2025, 61_200, 48_900],
  [5, 2025, 58_400, 52_300],
  [6, 2025, 72_900, 55_100],
  [7, 2025, 49_800, 57_600],
  [8, 2025, 44_100, 51_200],
  [9, 2025, 68_300, 54_800],
  [10, 2025, 76_500, 59_400],
  [11, 2025, 71_200, 63_900],
  [12, 2025, 83_400, 71_800],
  [1, 2026, 52_700, 66_100],
  [2, 2026, 69_900, 58_300],
  [3, 2026, 74_600, 61_500],
];

export function cashFlow(rate: number): CashFlowPoint[] {
  return FLOW.map(([month, year, inflow, outflow]) => ({
    month: d(month, 1, year),
    inflow: scale(inflow, rate),
    outflow: scale(outflow, rate),
  }));
}

export function kpis(rate: number, pl = false): Kpi[] {
  const money = (values: number[]) => values.map((v) => scale(v, rate));
  return [
    {
      id: 'revenue',
      label: pick(pl, 'Revenue', 'Przychody'),
      format: 'money',
      better: 'up',
      value: scale(74_600, rate),
      previous: scale(69_900, rate),
      series: money([
        61_200, 58_400, 72_900, 49_800, 44_100, 68_300, 76_500, 71_200, 83_400, 52_700, 69_900,
        74_600,
      ]),
    },
    {
      id: 'spend',
      label: pick(pl, 'Operating spend', 'Koszty operacyjne'),
      format: 'money',
      better: 'down',
      value: scale(61_500, rate),
      previous: scale(58_300, rate),
      series: money([
        48_900, 52_300, 55_100, 57_600, 51_200, 54_800, 59_400, 63_900, 71_800, 66_100, 58_300,
        61_500,
      ]),
    },
    {
      id: 'margin',
      label: pick(pl, 'Gross margin', 'Marża brutto'),
      format: 'percent',
      better: 'up',
      value: 0.412,
      previous: 0.398,
      series: [0.37, 0.36, 0.39, 0.35, 0.34, 0.38, 0.4, 0.39, 0.41, 0.37, 0.398, 0.412],
    },
    {
      id: 'dso',
      label: pick(pl, 'Receivables', 'Należności'),
      format: 'money',
      better: 'down',
      value: scale(53_615.9, rate),
      previous: scale(57_202.4, rate),
      series: money([
        48_100, 51_900, 55_300, 60_200, 58_700, 54_100, 52_800, 56_400, 61_900, 59_300, 57_202.4,
        53_615.9,
      ]),
    },
  ];
}

export function receivables(rate: number): Receivable[] {
  const rows: [string, string, Date, number][] = [
    ['Kestrel Analytics Ltd', 'INV-0121', d(2, 19), 6_240],
    ['Borowik Meble sp. z o.o.', 'INV-0124', d(2, 27), 6_872.5],
    ['Atelier Lune SARL', 'INV-0127', d(3, 5), 3_915],
    ['Cobham Rail Services', 'INV-0133', d(3, 19), 9_480],
    ['Pardo & Hijos SL', 'INV-0136', d(3, 26), 4_128.4],
    ['Greywell Partners LLP', 'INV-0139', d(4, 1), 15_600],
    ['Kestrel Analytics Ltd', 'INV-0142', d(4, 8), 7_380],
    ['Halvorsen Marine AS', 'INV-0097', d(1, 9), 3_208.75],
    ['Pardo & Hijos SL', 'INV-0088', d(12, 12, 2025), 1_940],
    ['Vantaa Foods Oy', 'INV-0071', d(11, 20, 2025), 2_315.6],
    ['Borowik Meble sp. z o.o.', 'INV-0102', d(1, 28), 4_410],
  ];
  return rows.map(([customer, invoice, due, outstanding], index) => ({
    id: `r${String(index)}`,
    customer,
    invoice,
    due,
    outstanding: scale(outstanding, rate),
  }));
}

export function budget(rate: number, pl = false): BudgetLine[] {
  const rows: [string, number, number][] = [
    [pick(pl, 'Salaries', 'Wynagrodzenia'), 128_000, 126_450],
    [pick(pl, 'Contractors', 'Podwykonawcy'), 18_000, 23_870],
    [pick(pl, 'Software', 'Oprogramowanie'), 9_600, 9_640],
    [pick(pl, 'Cloud hosting', 'Hosting w chmurze'), 14_500, 12_115.3],
    [pick(pl, 'Travel', 'Podróże służbowe'), 6_000, 7_382.4],
    [pick(pl, 'Marketing', 'Marketing'), 22_000, 15_940],
  ];
  return rows.map(([category, planned, actual], index) => ({
    id: `b${String(index)}`,
    category,
    budget: scale(planned, rate),
    actual: scale(actual, rate),
  }));
}

export function expenses(rate: number, pl = false): ApprovalState {
  const travel = pick(pl, 'Travel', 'Podróże');
  const software = pick(pl, 'Software', 'Oprogramowanie');
  const at = (day: number, hour: number, minute: number) => new Date(2026, 2, day, hour, minute);
  const rows: [string, string, string, Date, number, string[]?][] = [
    ['Marta Zielińska', 'Lufthansa', travel, d(3, 16), 412.8],
    [
      'Tom Avery',
      'The Shelbourne',
      pick(pl, 'Accommodation', 'Noclegi'),
      d(3, 14),
      689,
      [pick(pl, 'Over the nightly hotel limit', 'Powyżej limitu za noc w hotelu')],
    ],
    ['Marta Zielińska', 'Uber', travel, d(3, 17), 23.4],
    ['Jonas Berg', 'JetBrains', software, d(3, 12), 289],
    [
      'Aoife Byrne',
      'Wagamama',
      pick(pl, 'Meals', 'Posiłki'),
      d(3, 18),
      64.5,
      [pick(pl, 'No receipt', 'Brak paragonu')],
    ],
    ['Tom Avery', 'Irish Rail', travel, d(3, 15), 38.9],
  ];
  return {
    requests: [
      ...rows.map(([employee, merchant, category, date, amount, flags], index) => ({
        id: `x${String(index)}`,
        employee,
        merchant,
        category,
        date,
        amount: scale(amount, rate),
        status: 'pending' as const,
        ...(flags === undefined ? {} : { flags }),
      })),
      {
        id: 'x8',
        employee: 'Jonas Berg',
        merchant: 'Figma',
        category: software,
        date: d(3, 9),
        amount: scale(540, rate),
        status: 'approved',
      },
      {
        id: 'x9',
        employee: 'Aoife Byrne',
        merchant: 'Ryanair',
        category: travel,
        date: d(3, 4),
        amount: scale(186.2, rate),
        status: 'rejected',
      },
    ],
    events: [
      {
        id: 'v1',
        requestId: 'x9',
        action: 'rejected',
        actor: 'Niamh Walsh',
        at: at(17, 9, 12),
        reason: pick(
          pl,
          'Booked outside the travel tool, rebook through it',
          'Zarezerwowane poza systemem podróży, zarezerwuj ponownie przez system',
        ),
      },
      { id: 'v2', requestId: 'x8', action: 'approved', actor: 'Niamh Walsh', at: at(18, 16, 40) },
    ],
  };
}

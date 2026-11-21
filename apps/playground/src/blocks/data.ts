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
  id: 'en-GB';
  locale: string;
  currency: string;
}

export const LOCALES: Record<Locale['id'], Locale> = {
  'en-GB': { id: 'en-GB', locale: 'en-GB', currency: 'EUR' },
};

/** The page's own words around the blocks: periods, the comparison and the dashboard header. */
export function copy() {
  return {
    month: 'March 2026',
    quarter: 'Q1 2026',
    quarterProgress: 'Q1 2026, 11 of 13 weeks',
    comparison: 'vs February',
    kpiLabel: 'Key figures, March 2026',
    dashboardTitle: 'Finance, March 2026',
  };
}

const INVOICES: InvoiceSummary[] = [
  {
    id: 'i00a',
    number: 'INV-2025-0071',
    customer: 'Vantaa Foods Oy',
    issued: d(10, 21, 2025),
    due: d(11, 20, 2025),
    total: 2_315.6,
    status: 'sent',
  },
  {
    id: 'i00b',
    number: 'INV-2025-0088',
    customer: 'Pardo & Hijos SL',
    issued: d(11, 12, 2025),
    due: d(12, 12, 2025),
    total: 1_940,
    status: 'sent',
  },
  {
    id: 'i00c',
    number: 'INV-2026-0097',
    customer: 'Halvorsen Marine AS',
    issued: d(12, 10, 2025),
    due: d(1, 9),
    total: 3_208.75,
    status: 'sent',
  },
  {
    id: 'i00d',
    number: 'INV-2026-0102',
    customer: 'Barrett Furniture Ltd',
    issued: d(12, 29, 2025),
    due: d(1, 28),
    total: 4_410,
    status: 'sent',
  },
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
    customer: 'Barrett Furniture Ltd',
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

export function invoices(): InvoiceSummary[] {
  return INVOICES;
}

export function invoiceDocument(): InvoiceDocument {
  return {
    number: 'INV-2026-0124',
    status: 'sent',
    issued: d(1, 28),
    due: d(2, 27),
    reference: 'PO 4471-BF',
    seller: {
      name: 'Fernhill Systems Ltd',
      address: ['14 Harcourt Street', 'Dublin D02 YX88', 'Ireland'],
      taxId: 'IE 3412876LH',
    },
    buyer: {
      name: 'Barrett Furniture Ltd',
      address: ['Unit 4, Mahon Business Park', 'Cork T12 AB34', 'Ireland'],
      taxId: 'IE 8274915KH',
    },
    lines: [
      {
        id: 'l1',
        description: 'Warehouse scheduling licence',
        detail: 'Annual, 40 seats, Feb 2026 to Jan 2027',
        quantity: 40,
        unit: 'seats',
        unitPrice: 186,
        taxRate: 0.23,
      },
      {
        id: 'l2',
        description: 'Integration with the ERP',
        detail: 'Order and stock sync, fixed scope',
        quantity: 1,
        unitPrice: 1_450,
        taxRate: 0.23,
      },
      {
        id: 'l3',
        description: 'On-site training',
        detail: 'Cork, two days',
        quantity: 14,
        unit: 'h',
        unitPrice: 95,
        taxRate: 0.23,
      },
      {
        id: 'l4',
        description: 'Printed operator guides',
        quantity: 25,
        unit: 'pcs',
        unitPrice: 12.9,
        taxRate: 0.135,
      },
    ],
    payments: [
      {
        id: 'p1',
        date: d(2, 20),
        amount: 5_000,
        method: 'Bank transfer, SEPA',
      },
    ],
    notes: 'Pay by bank transfer to IE29 AIBK 9311 5212 3456 78, quoting the invoice number.',
  };
}

const ACCOUNT_ROWS: [code: string, name: string, normal: LedgerAccount['normal']][] = [
  ['1000', 'Bank, current account', 'debit'],
  ['1100', 'Trade debtors', 'debit'],
  ['2100', 'Trade creditors', 'credit'],
  ['2200', 'VAT payable', 'credit'],
  ['4000', 'Licence revenue', 'credit'],
  ['4100', 'Services revenue', 'credit'],
  ['6100', 'Software subscriptions', 'debit'],
  ['6200', 'Travel', 'debit'],
];

export function accounts(): LedgerAccount[] {
  return ACCOUNT_ROWS.map(([code, name, normal]) => ({ code, name, normal }));
}

type Posting = [account: string, debit: number, credit: number];

const ENTRIES: {
  id: string;
  date: Date;
  reference: string;
  description: string;
  lines: Posting[];
}[] = [
  {
    id: 'e1',
    date: d(3, 2),
    reference: 'INV-2026-0139',
    description: 'Invoice to Greywell Partners',
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
    description: 'Rail to Cork, training',
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
    lines: [
      ['1000', 21_034.8, 0],
      ['1100', 0, 21_034.8],
    ],
  },
];

export function journal(): JournalLine[] {
  return ENTRIES.flatMap((entry) =>
    entry.lines.map(([accountCode, debit, credit], index) => ({
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

export function openingBalances(): Record<string, number> {
  return {
    '1000': 48_215.6,
    '1100': 66_934.2,
    '2200': -8_402.11,
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

export function cashFlow(): CashFlowPoint[] {
  return FLOW.map(([month, year, inflow, outflow]) => ({
    month: d(month, 1, year),
    inflow,
    outflow,
  }));
}

export function kpis(): Kpi[] {
  return [
    {
      id: 'revenue',
      label: 'Revenue',
      format: 'money',
      better: 'up',
      value: 74_600,
      previous: 69_900,
      series: [
        61_200, 58_400, 72_900, 49_800, 44_100, 68_300, 76_500, 71_200, 83_400, 52_700, 69_900,
        74_600,
      ],
    },
    {
      id: 'spend',
      label: 'Operating spend',
      format: 'money',
      better: 'down',
      value: 61_500,
      previous: 58_300,
      series: [
        48_900, 52_300, 55_100, 57_600, 51_200, 54_800, 59_400, 63_900, 71_800, 66_100, 58_300,
        61_500,
      ],
    },
    {
      id: 'margin',
      label: 'Gross margin',
      format: 'percent',
      better: 'up',
      value: 0.412,
      previous: 0.398,
      series: [0.37, 0.36, 0.39, 0.35, 0.34, 0.38, 0.4, 0.39, 0.41, 0.37, 0.398, 0.412],
    },
    {
      id: 'dso',
      label: 'Receivables',
      format: 'money',
      better: 'down',
      value: 65_490.25,
      previous: 69_114.8,
      series: [
        58_100, 61_900, 65_300, 70_200, 68_700, 64_100, 62_800, 66_400, 71_900, 70_300, 69_114.8,
        65_490.25,
      ],
    },
  ];
}

export function receivables(): Receivable[] {
  const rows: [string, string, Date, number][] = [
    ['Kestrel Analytics Ltd', 'INV-2026-0121', d(2, 19), 6_240],
    ['Barrett Furniture Ltd', 'INV-2026-0124', d(2, 27), 6_872.5],
    ['Atelier Lune SARL', 'INV-2026-0127', d(3, 5), 3_915],
    ['Cobham Rail Services', 'INV-2026-0133', d(3, 19), 9_480],
    ['Pardo & Hijos SL', 'INV-2026-0136', d(3, 26), 4_128.4],
    ['Greywell Partners LLP', 'INV-2026-0139', d(4, 1), 15_600],
    ['Kestrel Analytics Ltd', 'INV-2026-0142', d(4, 8), 7_380],
    ['Halvorsen Marine AS', 'INV-2026-0097', d(1, 9), 3_208.75],
    ['Pardo & Hijos SL', 'INV-2025-0088', d(12, 12, 2025), 1_940],
    ['Vantaa Foods Oy', 'INV-2025-0071', d(11, 20, 2025), 2_315.6],
    ['Barrett Furniture Ltd', 'INV-2026-0102', d(1, 28), 4_410],
  ];
  return rows.map(([customer, invoice, due, outstanding], index) => ({
    id: `r${String(index)}`,
    customer,
    invoice,
    due,
    outstanding: outstanding,
  }));
}

export function budget(): BudgetLine[] {
  const rows: [string, number, number][] = [
    ['Salaries', 128_000, 126_450],
    ['Contractors', 18_000, 23_870],
    ['Software', 9_600, 9_640],
    ['Cloud hosting', 14_500, 12_115.3],
    ['Travel', 6_000, 7_382.4],
    ['Marketing', 22_000, 15_940],
  ];
  return rows.map(([category, planned, actual], index) => ({
    id: `b${String(index)}`,
    category,
    budget: planned,
    actual: actual,
  }));
}

export function expenses(): ApprovalState {
  const travel = 'Travel';
  const software = 'Software';
  const at = (day: number, hour: number, minute: number) => new Date(2026, 2, day, hour, minute);
  const rows: [string, string, string, Date, number, string[]?][] = [
    ['Clara Hughes', 'Lufthansa', travel, d(3, 16), 412.8],
    [
      'Tom Avery',
      'The Shelbourne',
      'Accommodation',
      d(3, 14),
      689,
      ['Over the nightly hotel limit'],
    ],
    ['Clara Hughes', 'Uber', travel, d(3, 17), 23.4],
    ['Jonas Berg', 'JetBrains', software, d(3, 12), 289],
    ['Aoife Byrne', 'Wagamama', 'Meals', d(3, 18), 64.5, ['No receipt']],
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
        amount: amount,
        status: 'pending' as const,
        ...(flags === undefined ? {} : { flags }),
      })),
      {
        id: 'x8',
        employee: 'Jonas Berg',
        merchant: 'Figma',
        category: software,
        date: d(3, 9),
        amount: 540,
        status: 'approved',
      },
      {
        id: 'x9',
        employee: 'Aoife Byrne',
        merchant: 'Ryanair',
        category: travel,
        date: d(3, 4),
        amount: 186.2,
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
        reason: 'Booked outside the travel tool, rebook through it',
      },
      { id: 'v2', requestId: 'x8', action: 'approved', actor: 'Niamh Walsh', at: at(18, 16, 40) },
    ],
  };
}

/** SaaS figures in the other formats: a count, a duration in seconds and money as `currency`. */
export function saasKpis(): Kpi[] {
  return [
    {
      id: 'active',
      label: 'Active users',
      format: 'number',
      better: 'up',
      value: 12_480,
      previous: 11_920,
      series: [9_800, 10_100, 10_400, 10_900, 11_200, 11_600, 11_920, 12_480],
    },
    {
      id: 'response',
      label: 'First response',
      format: 'duration',
      better: 'down',
      value: 4_920,
      previous: 6_300,
      series: [7_800, 7_200, 6_900, 6_600, 6_300, 5_700, 5_100, 4_920],
    },
    {
      id: 'mrr',
      label: 'Monthly recurring revenue',
      format: 'currency',
      better: 'up',
      value: 31_780,
      previous: 30_410,
      series: [24_870, 26_240, 27_015, 28_930, 29_600, 30_100, 30_410, 31_780],
    },
    {
      id: 'churn',
      label: 'Churn',
      format: 'percent',
      better: 'down',
      value: 0.021,
      previous: 0.026,
      series: [0.031, 0.029, 0.03, 0.027, 0.026, 0.025, 0.026, 0.021],
    },
  ];
}

import type {
  ApprovalState,
  BudgetLine,
  CashFlowPoint,
  InvoiceDocument,
  InvoiceSummary,
  JournalLine,
  Kpi,
  LedgerAccount,
  Receivable,
} from '@rectio/blocks';

/** Sample data for the block previews. The blocks take any data of these shapes. */
export const TODAY = new Date(2026, 2, 19);

const d = (month: number, day: number, year = 2026) => new Date(year, month - 1, day);

const REVENUE = [
  61_200, 58_400, 72_900, 49_800, 44_100, 68_300, 76_500, 71_200, 83_400, 52_700, 69_900, 74_600,
];
const SPEND = [
  48_900, 52_300, 55_100, 57_600, 51_200, 54_800, 59_400, 63_900, 71_800, 66_100, 58_300, 61_500,
];

export const KPIS: Kpi[] = [
  {
    id: 'revenue',
    label: 'Revenue',
    format: 'money',
    better: 'up',
    value: 74_600,
    previous: 69_900,
    series: REVENUE,
  },
  {
    id: 'spend',
    label: 'Operating spend',
    format: 'money',
    better: 'down',
    value: 61_500,
    previous: 58_300,
    series: SPEND,
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
];

export const CASH_FLOW: CashFlowPoint[] = REVENUE.map((inflow, index) => ({
  month: new Date(2025, 3 + index, 1),
  inflow,
  outflow: SPEND[index] ?? 0,
}));

export const INVOICES: InvoiceSummary[] = [
  {
    id: 'i1',
    number: 'INV-0118',
    customer: 'Nordwind Logistik GmbH',
    issued: d(1, 12),
    due: d(2, 11),
    total: 18_450,
    status: 'paid',
  },
  {
    id: 'i2',
    number: 'INV-0121',
    customer: 'Kestrel Analytics Ltd',
    issued: d(1, 20),
    due: d(2, 19),
    total: 6_240,
    status: 'sent',
  },
  {
    id: 'i3',
    number: 'INV-0124',
    customer: 'Barrett Furniture Ltd',
    issued: d(1, 28),
    due: d(2, 27),
    total: 11_872.5,
    amountPaid: 5_000,
    status: 'sent',
  },
  {
    id: 'i4',
    number: 'INV-0133',
    customer: 'Cobham Rail Services',
    issued: d(2, 17),
    due: d(3, 19),
    total: 9_480,
    status: 'sent',
  },
  {
    id: 'i5',
    number: 'INV-0139',
    customer: 'Greywell Partners LLP',
    issued: d(3, 2),
    due: d(4, 1),
    total: 15_600,
    status: 'sent',
  },
  {
    id: 'i6',
    number: 'INV-0144',
    customer: 'Halvorsen Marine AS',
    issued: d(3, 12),
    due: d(4, 11),
    total: 2_460,
    status: 'void',
  },
  {
    id: 'i7',
    number: 'INV-0145',
    customer: 'Atelier Lune SARL',
    issued: d(3, 17),
    due: d(4, 16),
    total: 5_166,
    status: 'draft',
  },
];

export const INVOICE: InvoiceDocument = {
  number: 'INV-0124',
  status: 'sent',
  issued: d(1, 28),
  due: d(2, 27),
  reference: 'PO 4471-BF',
  seller: {
    name: 'Fernhill Systems Ltd',
    address: ['14 Harcourt Street', 'Dublin D02 YX88'],
    taxId: 'IE 3412876LH',
  },
  buyer: {
    name: 'Barrett Furniture Ltd',
    address: ['Unit 4, Mahon Business Park', 'Cork T12 AB34'],
    taxId: 'IE 8274915KH',
  },
  lines: [
    {
      id: 'l1',
      description: 'Warehouse scheduling licence',
      detail: 'Annual, 40 seats',
      quantity: 40,
      unit: 'seats',
      unitPrice: 186,
      taxRate: 0.23,
    },
    {
      id: 'l2',
      description: 'Integration with the ERP',
      quantity: 1,
      unitPrice: 1_450,
      taxRate: 0.23,
    },
    {
      id: 'l3',
      description: 'Printed operator guides',
      quantity: 25,
      unit: 'pcs',
      unitPrice: 12.9,
      taxRate: 0.135,
    },
  ],
  payments: [{ id: 'p1', date: d(2, 20), amount: 5_000, method: 'Bank transfer' }],
};

export const ACCOUNTS: LedgerAccount[] = [
  { code: '1000', name: 'Bank, current account', normal: 'debit' },
  { code: '1100', name: 'Trade debtors', normal: 'debit' },
  { code: '2200', name: 'VAT payable', normal: 'credit' },
  { code: '4100', name: 'Services revenue', normal: 'credit' },
];

const line = (
  id: string,
  entryId: string,
  date: Date,
  reference: string,
  description: string,
  accountCode: string,
  debit: number,
  credit: number,
): JournalLine => ({
  id,
  entryId,
  date,
  reference,
  description,
  accountCode,
  debit,
  credit,
});

export const JOURNAL: JournalLine[] = [
  line('1', 'e1', d(3, 2), 'INV-0139', 'Invoice to Greywell Partners', '1100', 15_600, 0),
  line('2', 'e1', d(3, 2), 'INV-0139', 'Invoice to Greywell Partners', '4100', 0, 12_682.93),
  line('3', 'e1', d(3, 2), 'INV-0139', 'Invoice to Greywell Partners', '2200', 0, 2_917.07),
  line('4', 'e2', d(3, 16), 'BNK-0318', 'Payment from Kestrel Analytics', '1000', 6_240, 0),
  line('5', 'e2', d(3, 16), 'BNK-0318', 'Payment from Kestrel Analytics', '1100', 0, 6_240),
];

export const OPENING: Record<string, number> = { '1000': 48_215.6, '1100': 66_934.2 };

export const RECEIVABLES: Receivable[] = [
  {
    id: 'r1',
    customer: 'Greywell Partners LLP',
    invoice: 'INV-0139',
    due: d(4, 1),
    outstanding: 15_600,
  },
  {
    id: 'r2',
    customer: 'Kestrel Analytics Ltd',
    invoice: 'INV-0121',
    due: d(2, 19),
    outstanding: 6_240,
  },
  {
    id: 'r3',
    customer: 'Barrett Furniture Ltd',
    invoice: 'INV-0124',
    due: d(2, 27),
    outstanding: 6_872.5,
  },
  {
    id: 'r4',
    customer: 'Barrett Furniture Ltd',
    invoice: 'INV-0102',
    due: d(1, 28),
    outstanding: 4_410,
  },
  {
    id: 'r5',
    customer: 'Halvorsen Marine AS',
    invoice: 'INV-0097',
    due: d(1, 9),
    outstanding: 3_208.75,
  },
  {
    id: 'r6',
    customer: 'Vantaa Foods Oy',
    invoice: 'INV-0071',
    due: d(11, 20, 2025),
    outstanding: 2_315.6,
  },
];

export const BUDGET: BudgetLine[] = [
  { id: 'b1', category: 'Salaries', budget: 128_000, actual: 126_450 },
  { id: 'b2', category: 'Contractors', budget: 18_000, actual: 23_870 },
  { id: 'b3', category: 'Software', budget: 9_600, actual: 9_640 },
  { id: 'b4', category: 'Travel', budget: 6_000, actual: 7_382.4 },
  { id: 'b5', category: 'Marketing', budget: 22_000, actual: 15_940 },
];

export const EXPENSES: ApprovalState = {
  requests: [
    {
      id: 'x1',
      employee: 'Clara Hughes',
      merchant: 'Lufthansa',
      category: 'Travel',
      date: d(3, 16),
      amount: 412.8,
      status: 'pending',
    },
    {
      id: 'x2',
      employee: 'Tom Avery',
      merchant: 'The Shelbourne',
      category: 'Accommodation',
      date: d(3, 14),
      amount: 689,
      status: 'pending',
      flags: ['Over the nightly hotel limit'],
    },
    {
      id: 'x3',
      employee: 'Aoife Byrne',
      merchant: 'Wagamama',
      category: 'Meals',
      date: d(3, 18),
      amount: 64.5,
      status: 'pending',
      flags: ['No receipt'],
    },
    {
      id: 'x4',
      employee: 'Jonas Berg',
      merchant: 'Figma',
      category: 'Software',
      date: d(3, 9),
      amount: 540,
      status: 'approved',
    },
  ],
  events: [
    {
      id: 'v1',
      requestId: 'x4',
      action: 'approved',
      actor: 'Niamh Walsh',
      at: new Date(2026, 2, 18, 16, 40),
    },
  ],
};

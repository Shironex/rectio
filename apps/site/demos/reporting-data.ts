import type { PlLine, PlannedChange, RunwayMonth, TaxRateEntry } from '@rectio/blocks';

/** Sample data for the reporting block demos: a software company, first quarter of 2026. */
export const TODAY = new Date(2026, 2, 19);

export const PL_LINES: PlLine[] = [
  {
    id: '7000',
    section: 'revenue',
    account: 'Subscriptions',
    code: '7000',
    current: 412_380,
    comparison: 356_900,
  },
  {
    id: '7010',
    section: 'revenue',
    account: 'Professional services',
    code: '7010',
    current: 86_450,
    comparison: 92_100,
  },
  {
    id: '5010',
    section: 'costOfSales',
    account: 'Hosting and infrastructure',
    code: '5010',
    current: 48_920,
    comparison: 41_300,
  },
  {
    id: '5020',
    section: 'costOfSales',
    account: 'Payment processing',
    code: '5020',
    current: 12_370,
    comparison: 10_880,
  },
  {
    id: '4010',
    section: 'operatingExpenses',
    account: 'Salaries and wages',
    code: '4010',
    current: 196_800,
    comparison: 171_450,
  },
  {
    id: '4020',
    section: 'operatingExpenses',
    account: 'Marketing',
    code: '4020',
    current: 54_230,
    comparison: 61_900,
  },
  {
    id: '4030',
    section: 'operatingExpenses',
    account: 'Office and rent',
    code: '4030',
    current: 28_500,
    comparison: 27_000,
  },
  {
    id: '7500',
    section: 'otherIncome',
    account: 'Interest received',
    code: '7500',
    current: 2_140,
    comparison: 860,
  },
  {
    id: '8700',
    section: 'tax',
    account: 'Corporation tax',
    code: '8700',
    current: 30_480,
    comparison: 21_890,
  },
];

export const TAX_ENTRIES: TaxRateEntry[] = [
  { id: 'vat-23', rate: 0.23, outputBase: 284_600, inputBase: 96_450 },
  { id: 'vat-8', rate: 0.08, outputBase: 18_200, inputBase: 6_300 },
  { id: 'vat-0', rate: 0, outputBase: 31_400, inputBase: 0 },
  { id: 'exempt', rate: 'exempt', outputBase: 7_900, inputBase: 2_400 },
];

const FLOWS: [number, number][] = [
  [126_300, 158_900],
  [119_800, 160_400],
  [112_600, 154_300],
  [131_200, 168_700],
  [134_900, 171_300],
  [128_400, 176_900],
  [141_700, 183_200],
  [129_300, 178_600],
  [133_800, 181_400],
  [136_200, 184_900],
];

/** June 2025 to March 2026. */
export const RUNWAY_HISTORY: RunwayMonth[] = FLOWS.map(([inflow, outflow], index) => ({
  month: new Date(2025, 5 + index, 1),
  inflow,
  outflow,
}));

export const RUNWAY_PLANNED: PlannedChange[] = [
  { month: new Date(2026, 5, 1), amount: -18_000, label: 'Annual insurance' },
];

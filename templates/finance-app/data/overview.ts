import type { BudgetLine, CashFlowPoint, Kpi } from '@rectio/blocks';

import { day } from './company';
import { RECEIVABLES_TOTAL } from './invoices';

export type Period = 'month' | 'last-month' | 'quarter' | 'year';

export const PERIODS: readonly { value: Period; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'year', label: 'Year to date' },
];

const FLOW: [month: number, year: number, inflow: number, outflow: number][] = [
  [12, 2025, 83_400, 71_800],
  [1, 2026, 52_700, 66_100],
  [2, 2026, 69_900, 58_300],
  [3, 2026, 74_600, 61_500],
  [4, 2026, 78_200, 63_900],
  [5, 2026, 71_450, 64_200],
  [6, 2026, 88_900, 66_750],
  [7, 2026, 64_300, 69_400],
  [8, 2026, 59_850, 62_100],
  [9, 2026, 92_400, 70_350],
  [10, 2026, 97_150, 73_800],
  [11, 2026, 68_420.55, 49_760.13],
];

/** Twelve months of cash in and out, December 2025 to November 2026 (November to date). */
export const CASH_FLOW: readonly CashFlowPoint[] = FLOW.map(([month, year, inflow, outflow]) => ({
  month: day(year, month, 1),
  inflow,
  outflow,
}));

const revenue = FLOW.map(([, , inflow]) => inflow);
const spend = FLOW.map(([, , , outflow]) => outflow);
const margin = [0.39, 0.36, 0.4, 0.41, 0.42, 0.4, 0.43, 0.38, 0.37, 0.44, 0.45, 0.452];
const receivables = [
  88_120,
  91_400,
  86_950,
  84_300,
  89_760,
  93_210,
  97_840,
  101_560,
  99_020,
  103_870,
  96_934.2,
  RECEIVABLES_TOTAL,
];

interface PeriodFigures {
  /** Shown under the page title. */
  label: string;
  /** What the KPI changes are measured against. */
  comparison: string;
  kpis: Kpi[];
  /** Spend against the plan for the period. */
  budget: BudgetLine[];
}

const sum = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;

function kpis(
  window: [from: number, to: number],
  previous: [from: number, to: number],
  receivablesIndex: number,
): Kpi[] {
  const slice = (values: number[], [from, to]: [number, number]) => values.slice(from, to + 1);
  return [
    {
      id: 'revenue',
      label: 'Cash in',
      format: 'money',
      better: 'up',
      value: sum(slice(revenue, window)),
      previous: sum(slice(revenue, previous)),
      series: revenue,
    },
    {
      id: 'spend',
      label: 'Operating spend',
      format: 'money',
      better: 'down',
      value: sum(slice(spend, window)),
      previous: sum(slice(spend, previous)),
      series: spend,
    },
    {
      id: 'margin',
      label: 'Gross margin',
      format: 'percent',
      better: 'up',
      value: margin[window[1]] ?? 0,
      previous: margin[previous[1]] ?? 0,
      series: margin,
    },
    {
      id: 'receivables',
      label: 'Receivables',
      format: 'money',
      better: 'down',
      value: receivables[receivablesIndex] ?? 0,
      previous: receivables[receivablesIndex - 1] ?? 0,
      series: receivables.slice(0, receivablesIndex + 1),
    },
  ];
}

const BUDGET: [category: string, monthly: number, actual: Record<Period, number>][] = [
  ['Salaries', 42_500, { month: 28_310, 'last-month': 42_180, quarter: 112_940, year: 461_820 }],
  ['Contractors', 6_000, { month: 4_150, 'last-month': 8_960, quarter: 21_430, year: 74_210 }],
  [
    'Cloud hosting',
    3_400,
    { month: 3_184.22, 'last-month': 3_052.9, quarter: 9_461.37, year: 35_118.6 },
  ],
  ['Software', 1_600, { month: 1_340.2, 'last-month': 1_588.4, quarter: 4_516.8, year: 17_204.35 }],
  ['Travel', 2_200, { month: 2_418.75, 'last-month': 2_906.1, quarter: 7_884.3, year: 23_670.45 }],
  ['Marketing', 5_500, { month: 2_960, 'last-month': 6_120, quarter: 13_480, year: 52_340 }],
  [
    'Rent and office',
    4_600,
    { month: 4_246.8, 'last-month': 4_612.3, quarter: 13_458.9, year: 50_311.2 },
  ],
];

/** Months of plan in each period: November is 19 of 30 days in, so its plan is pro rata. */
const MONTHS: Record<Period, number> = {
  month: 19 / 30,
  'last-month': 1,
  quarter: 2 + 19 / 30,
  year: 10 + 19 / 30,
};

function budget(period: Period): BudgetLine[] {
  return BUDGET.map(([category, monthly, actual], index) => ({
    id: `b${String(index)}`,
    category,
    budget: Math.round(monthly * MONTHS[period] * 100) / 100,
    actual: actual[period],
  }));
}

/**
 * A period still running is compared with the same share of the one before, so 19 days of November
 * are not measured against all of October.
 */
function partOf(figures: Kpi[], share: number): Kpi[] {
  return figures.map((kpi) =>
    kpi.id === 'revenue' || kpi.id === 'spend'
      ? { ...kpi, previous: Math.round(kpi.previous * share * 100) / 100 }
      : kpi,
  );
}

export const PERIOD_FIGURES: Record<Period, PeriodFigures> = {
  month: {
    label: 'November 2026, to date',
    comparison: 'vs 1 to 19 October',
    kpis: partOf(kpis([11, 11], [10, 10], 11), 19 / 31),
    budget: budget('month'),
  },
  'last-month': {
    label: 'October 2026',
    comparison: 'vs September',
    kpis: kpis([10, 10], [9, 9], 10),
    budget: budget('last-month'),
  },
  quarter: {
    label: 'Q4 2026, to date',
    comparison: 'vs the same days of Q3',
    kpis: partOf(kpis([10, 11], [7, 9], 11), 50 / 92),
    budget: budget('quarter'),
  },
  year: {
    label: '2026, to date',
    comparison: 'vs the same months of 2025',
    kpis: kpis([1, 11], [0, 0], 11).map((kpi) =>
      kpi.id === 'revenue' || kpi.id === 'spend'
        ? { ...kpi, previous: Math.round(kpi.value * (kpi.id === 'revenue' ? 0.872 : 0.914)) }
        : kpi,
    ),
    budget: budget('year'),
  },
};

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  actor: string;
  at: Date;
  tone: 'neutral' | 'accent' | 'positive' | 'warning' | 'negative';
  href: string;
}

const at = (dateOfMonth: number, hour: number, minute: number) =>
  new Date(2026, 10, dateOfMonth, hour, minute);

export const ACTIVITY: readonly ActivityItem[] = [
  {
    id: 'a1',
    title: 'Payment matched',
    detail: 'Bank line from Quayside Hotels matched to INV-2026-0208',
    actor: 'Bank feed',
    at: at(19, 9, 14),
    tone: 'positive',
    href: '/journal',
  },
  {
    id: 'a2',
    title: 'Expense approved',
    detail: 'Figma, team plan, €540.00 for Jonas Berg',
    actor: 'Niamh Walsh',
    at: at(18, 16, 40),
    tone: 'accent',
    href: '/expenses',
  },
  {
    id: 'a3',
    title: 'Reminder sent',
    detail: 'Second reminder to Kestrel Analytics for INV-2026-0202',
    actor: 'Automatic',
    at: at(18, 8, 0),
    tone: 'warning',
    href: '/invoices',
  },
  {
    id: 'a4',
    title: 'Supplier payment run',
    detail: 'Six bills paid from the AIB current account',
    actor: 'Rory Quinn',
    at: at(16, 11, 22),
    tone: 'neutral',
    href: '/journal',
  },
  {
    id: 'a5',
    title: 'October closed',
    detail: 'Journal locked, reports ready for review',
    actor: 'Rory Quinn',
    at: at(12, 17, 5),
    tone: 'neutral',
    href: '/reports',
  },
];

/** Dates the finance team works towards. */
export const DEADLINES: readonly { id: string; title: string; due: Date; href: string }[] = [
  { id: 'd1', title: 'VAT return, November and December', due: day(2027, 1, 23), href: '/reports' },
  { id: 'd2', title: 'Payroll, November', due: day(2026, 11, 25), href: '/journal' },
  { id: 'd3', title: 'Close November', due: day(2026, 12, 4), href: '/journal' },
];

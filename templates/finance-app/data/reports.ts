import type { BudgetLine } from '@rectio/blocks';

import { RECEIVABLES_TOTAL } from './invoices';
import { PERIOD_FIGURES } from './overview';

export type ReportPeriod = 'month' | 'quarter' | 'year';

export const REPORT_PERIODS: readonly { value: ReportPeriod; label: string; compare: string }[] = [
  { value: 'month', label: 'October 2026', compare: 'September 2026' },
  { value: 'quarter', label: 'Q3 2026', compare: 'Q2 2026' },
  { value: 'year', label: 'January to October 2026', compare: 'January to October 2025' },
];

export interface ReportLine {
  id: string;
  label: string;
  /** This period and the period compared with, major units. Costs are positive. */
  current: number;
  previous: number;
}

export interface ReportSection {
  id: string;
  label: string;
  kind: 'revenue' | 'cost';
  lines: ReportLine[];
}

/** Profit and loss by period: figures for the closed months only. */
export const PROFIT_AND_LOSS: Record<ReportPeriod, ReportSection[]> = {
  month: [
    {
      id: 'revenue',
      label: 'Revenue',
      kind: 'revenue',
      lines: [
        { id: 'r1', label: 'Licence revenue', current: 58_420, previous: 54_180 },
        { id: 'r2', label: 'Services revenue', current: 27_960, previous: 31_450 },
        { id: 'r3', label: 'Support revenue', current: 9_600, previous: 8_960 },
      ],
    },
    {
      id: 'cost-of-sales',
      label: 'Cost of sales',
      kind: 'cost',
      lines: [
        { id: 'c1', label: 'Cloud hosting', current: 3_052.9, previous: 2_986.4 },
        { id: 'c2', label: 'Implementation contractors', current: 8_960, previous: 10_240 },
        { id: 'c3', label: 'Payment fees', current: 412.35, previous: 438.1 },
      ],
    },
    {
      id: 'operating',
      label: 'Operating expenses',
      kind: 'cost',
      lines: [
        { id: 'o1', label: 'Salaries and PRSI', current: 42_180, previous: 41_960 },
        { id: 'o2', label: 'Rent and office', current: 4_612.3, previous: 4_480 },
        { id: 'o3', label: 'Software subscriptions', current: 1_588.4, previous: 1_512.6 },
        { id: 'o4', label: 'Travel and accommodation', current: 2_906.1, previous: 3_412.85 },
        { id: 'o5', label: 'Marketing', current: 6_120, previous: 4_870 },
        { id: 'o6', label: 'Professional fees', current: 1_850, previous: 1_850 },
      ],
    },
  ],
  quarter: [
    {
      id: 'revenue',
      label: 'Revenue',
      kind: 'revenue',
      lines: [
        { id: 'r1', label: 'Licence revenue', current: 152_340, previous: 141_870 },
        { id: 'r2', label: 'Services revenue', current: 81_220, previous: 74_960 },
        { id: 'r3', label: 'Support revenue', current: 26_880, previous: 24_960 },
      ],
    },
    {
      id: 'cost-of-sales',
      label: 'Cost of sales',
      kind: 'cost',
      lines: [
        { id: 'c1', label: 'Cloud hosting', current: 8_874.6, previous: 8_402.15 },
        { id: 'c2', label: 'Implementation contractors', current: 26_780, previous: 22_150 },
        { id: 'c3', label: 'Payment fees', current: 1_204.9, previous: 1_118.35 },
      ],
    },
    {
      id: 'operating',
      label: 'Operating expenses',
      kind: 'cost',
      lines: [
        { id: 'o1', label: 'Salaries and PRSI', current: 125_640, previous: 124_880 },
        { id: 'o2', label: 'Rent and office', current: 13_440, previous: 13_440 },
        { id: 'o3', label: 'Software subscriptions', current: 4_490.2, previous: 4_302.75 },
        { id: 'o4', label: 'Travel and accommodation', current: 7_284.4, previous: 9_106.2 },
        { id: 'o5', label: 'Marketing', current: 15_960, previous: 17_340 },
        { id: 'o6', label: 'Professional fees', current: 5_550, previous: 7_200 },
      ],
    },
  ],
  year: [
    {
      id: 'revenue',
      label: 'Revenue',
      kind: 'revenue',
      lines: [
        { id: 'r1', label: 'Licence revenue', current: 498_760, previous: 431_220 },
        { id: 'r2', label: 'Services revenue', current: 262_340, previous: 238_910 },
        { id: 'r3', label: 'Support revenue', current: 84_480, previous: 71_040 },
      ],
    },
    {
      id: 'cost-of-sales',
      label: 'Cost of sales',
      kind: 'cost',
      lines: [
        { id: 'c1', label: 'Cloud hosting', current: 31_934.38, previous: 27_810.4 },
        { id: 'c2', label: 'Implementation contractors', current: 70_060, previous: 66_420 },
        { id: 'c3', label: 'Payment fees', current: 3_986.15, previous: 3_412.8 },
      ],
    },
    {
      id: 'operating',
      label: 'Operating expenses',
      kind: 'cost',
      lines: [
        { id: 'o1', label: 'Salaries and PRSI', current: 433_510, previous: 398_240 },
        { id: 'o2', label: 'Rent and office', current: 46_064.4, previous: 44_800 },
        { id: 'o3', label: 'Software subscriptions', current: 15_864.15, previous: 13_206.9 },
        { id: 'o4', label: 'Travel and accommodation', current: 21_251.7, previous: 24_918.35 },
        { id: 'o5', label: 'Marketing', current: 49_380, previous: 41_150 },
        { id: 'o6', label: 'Professional fees', current: 19_400, previous: 18_750 },
      ],
    },
  ],
};

export interface BalanceGroup {
  id: string;
  label: string;
  lines: { id: string; label: string; amount: number }[];
}

/** The balance sheet as at today, summarised. Assets equal liabilities plus equity. */
export const BALANCE_SHEET: readonly BalanceGroup[] = [
  {
    id: 'assets',
    label: 'Assets',
    lines: [
      { id: 'a1', label: 'Bank, AIB current account', amount: 161_438.04 },
      { id: 'a2', label: 'Bank, deposit account', amount: 250_000 },
      { id: 'a3', label: 'Trade debtors', amount: RECEIVABLES_TOTAL },
      { id: 'a4', label: 'Prepayments', amount: 9_812.5 },
      { id: 'a5', label: 'Equipment, net of depreciation', amount: 38_640 },
    ],
  },
  {
    id: 'liabilities',
    label: 'Liabilities',
    lines: [
      { id: 'l1', label: 'Trade creditors', amount: 12_339.64 },
      { id: 'l2', label: 'VAT', amount: 6_918.42 },
      { id: 'l3', label: 'PAYE and PRSI', amount: 14_206.8 },
      { id: 'l4', label: 'Deferred revenue', amount: 118_450 },
    ],
  },
];

/** Equity is what is left: the total of assets less liabilities. */
export function equityOf(groups: readonly BalanceGroup[]): number {
  const total = (id: string) =>
    groups
      .find((g) => g.id === id)
      ?.lines.reduce((sum, l) => sum + Math.round(l.amount * 100), 0) ?? 0;
  return (total('assets') - total('liabilities')) / 100;
}

/** Spend against plan for each report period, from the same plan as the overview. */
export const REPORT_BUDGET: Record<ReportPeriod, BudgetLine[]> = {
  month: PERIOD_FIGURES['last-month'].budget,
  quarter: PERIOD_FIGURES['last-month'].budget.map((line, index) => ({
    ...line,
    budget: line.budget * 3,
    actual: Math.round(line.actual * (2.86 + (index % 3) * 0.07) * 100) / 100,
  })),
  year: PERIOD_FIGURES['last-month'].budget.map((line, index) => ({
    ...line,
    budget: line.budget * 10,
    actual: Math.round(line.actual * (9.42 + (index % 4) * 0.21) * 100) / 100,
  })),
};

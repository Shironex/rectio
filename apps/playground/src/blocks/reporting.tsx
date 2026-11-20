import type * as plain from '@rectio/blocks';
import type { PlLine, PlannedChange, RunwayMonth, TaxRateEntry } from '@rectio/blocks';
import { Button } from '@rectio/ui';
import type { ReactNode } from 'react';

import type { Locale } from './data';
import { TODAY } from './data';

/**
 * The reporting blocks (profit and loss, tax summary, cash runway) with their sample data, kept
 * apart from the blocks page so it only names them. Sample data only: the blocks take any data of
 * these shapes.
 */
export const REPORTING_BLOCKS = ['profit-and-loss', 'tax-summary', 'cash-runway'] as const;
export type ReportingBlock = (typeof REPORTING_BLOCKS)[number];

export function isReportingBlock(name: string): name is ReportingBlock {
  return (REPORTING_BLOCKS as readonly string[]).includes(name);
}

export type ReportingBlocks = Pick<typeof plain, 'ProfitAndLoss' | 'TaxSummary' | 'CashRunway'>;

const month = (year: number, index: number) => new Date(year, index - 1, 1);

/** [account, section, code, current, comparison] */
const PL_LINES: readonly [string, PlLine['section'], string, number, number][] = [
  ['Subscriptions', 'revenue', '7000', 412_380, 356_900],
  ['Professional services', 'revenue', '7010', 86_450, 92_100],
  ['Hosting and infrastructure', 'costOfSales', '5010', 48_920, 41_300],
  ['Payment processing', 'costOfSales', '5020', 12_370, 10_880],
  ['Customer support', 'costOfSales', '5030', 38_640, 35_210],
  ['Salaries and wages', 'operatingExpenses', '4010', 196_800, 171_450],
  ['Marketing', 'operatingExpenses', '4020', 54_230, 61_900],
  ['Office and rent', 'operatingExpenses', '4030', 28_500, 27_000],
  ['Software subscriptions', 'operatingExpenses', '4040', 14_870, 12_960],
  ['Professional fees', 'operatingExpenses', '4050', 9_640, 11_280],
  ['Interest received', 'otherIncome', '7500', 2_140, 860],
  ['Foreign exchange losses', 'otherExpenses', '7510', 1_980, 3_420],
  ['Bank charges', 'otherExpenses', '7520', 720, 690],
  ['Corporation tax', 'tax', '8700', 17_920, 14_020],
];

export function profitAndLossLines(): PlLine[] {
  return PL_LINES.map(([account, section, code, current, comparison]) => ({
    id: code,
    section,
    account,
    code,
    current,
    comparison,
  }));
}

/** [id, rate, output base, input base] */
const TAX_RATES: readonly [string, TaxRateEntry['rate'], number, number][] = [
  ['vat-23', 0.23, 284_600, 96_450],
  ['vat-13-5', 0.135, 18_200, 6_300],
  ['vat-9', 0.09, 4_850, 1_120],
  ['vat-0', 0, 31_400, 0],
  ['exempt', 'exempt', 7_900, 2_400],
];

export function taxEntries(): TaxRateEntry[] {
  return TAX_RATES.map(([id, taxRate, output, input]) => ({
    id,
    rate: taxRate,
    outputBase: output,
    inputBase: input,
  }));
}

/** April 2025 to March 2026: [inflow, outflow]. */
const RUNWAY: readonly [number, number][] = [
  [118_400, 151_200],
  [121_900, 149_600],
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

export function runwayHistory(): RunwayMonth[] {
  return RUNWAY.map(([inflow, outflow], index) => ({
    month: month(2025, 4 + index),
    inflow,
    outflow,
  }));
}

export function runwayPlanned(): PlannedChange[] {
  return [
    {
      month: month(2026, 6),
      amount: -18_000,
      label: 'Annual insurance',
    },
  ];
}

const EMPTY_ACTION: Record<ReportingBlock, string> = {
  'profit-and-loss': 'Connect accounting',
  'tax-summary': 'View invoices',
  'cash-runway': 'Connect a bank account',
};

export function renderReporting(
  name: ReportingBlock,
  blocks: ReportingBlocks,
  locale: Locale,
  empty = false,
): ReactNode {
  // `state=alt` shows the other states for a design round: folded sections, an overdue return
  // and a short runway.
  const alt = new URLSearchParams(window.location.search).get('state') === 'alt';
  const common = { currency: locale.currency, locale: locale.locale };
  const action = (
    <Button variant={name === 'tax-summary' ? 'secondary' : 'primary'}>{EMPTY_ACTION[name]}</Button>
  );
  switch (name) {
    case 'profit-and-loss':
      return (
        <blocks.ProfitAndLoss
          {...common}
          lines={empty ? [] : profitAndLossLines()}
          period="Q1 2026"
          comparisonPeriod="Q1 2025"
          defaultCollapsed={alt ? ['costOfSales', 'otherExpenses'] : []}
          emptyAction={action}
        />
      );
    case 'tax-summary':
      return (
        <blocks.TaxSummary
          {...common}
          entries={empty ? [] : taxEntries()}
          period="Q1 2026, January to March"
          due={new Date(2026, 3, 25)}
          status={alt ? 'ready' : 'open'}
          today={alt ? new Date(2026, 3, 28) : TODAY}
          onFile={() => undefined}
          onExport={() => undefined}
          emptyAction={action}
        />
      );
    case 'cash-runway':
      return (
        <blocks.CashRunway
          {...common}
          history={empty ? [] : runwayHistory()}
          balance={alt ? 196_400 : 412_600}
          planned={runwayPlanned()}
          threshold={100_000}
          emptyAction={action}
        />
      );
  }
}

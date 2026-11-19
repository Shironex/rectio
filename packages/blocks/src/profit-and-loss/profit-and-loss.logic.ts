import { fromMinor, relativeChange, toMinor } from '../lib/finance';

/** The sections of an income statement, in the order the statement reads them. */
export const PL_SECTIONS = [
  'revenue',
  'costOfSales',
  'operatingExpenses',
  'otherIncome',
  'otherExpenses',
  'tax',
] as const;
export type PlSection = (typeof PL_SECTIONS)[number];

/** Sections that add to profit; the others take away from it. */
const INCOME: ReadonlySet<PlSection> = new Set(['revenue', 'otherIncome']);

export function isIncomeSection(section: PlSection): boolean {
  return INCOME.has(section);
}

export interface PlLine {
  id: string;
  section: PlSection;
  /** The account's name, such as "Software subscriptions". */
  account: string;
  /** The account code, for the reader who drills in. */
  code?: string;
  /**
   * The period's amount, major units, as the books show it: revenue and costs both positive. A
   * negative amount is a reversal, such as a refund booked against revenue.
   */
  current: number;
  /** The same account in the comparison period; leave it out when there is none. */
  comparison?: number;
}

export interface PlChange {
  /** Current minus comparison. */
  amount: number;
  /** `amount` against the comparison; null with nothing to compare with. */
  relative: number | null;
  direction: 'up' | 'down' | 'flat';
  /** Whether the change helps profit: more revenue or less cost. Null for no change. */
  favourable: boolean | null;
}

export interface PlFigure {
  current: number;
  /** Null when the statement has no comparison period. */
  comparison: number | null;
  change: PlChange | null;
}

export interface PlSectionTotals extends PlFigure {
  section: PlSection;
  lines: PlLine[];
}

export const PL_RESULTS = [
  'grossProfit',
  'operatingProfit',
  'profitBeforeTax',
  'netProfit',
] as const;
export type PlResult = (typeof PL_RESULTS)[number];

export interface PlMargins {
  /** Each result against revenue, 0 to 1 (negative for a loss); null for zero revenue. */
  current: Record<'gross' | 'operating' | 'net', number | null>;
  comparison: Record<'gross' | 'operating' | 'net', number | null> | null;
}

export interface ProfitAndLoss {
  sections: Record<PlSection, PlSectionTotals>;
  results: Record<PlResult, PlFigure>;
  margins: PlMargins;
  /** True when any line carries a comparison amount. */
  hasComparison: boolean;
}

/**
 * The change from `comparison` to `current`, exact to the minor unit; `income` says whether a rise
 * helps profit.
 */
export function plChange(
  current: number,
  comparison: number,
  income: boolean,
  currency: string,
): PlChange {
  const amount = fromMinor(toMinor(current, currency) - toMinor(comparison, currency), currency);
  const direction = amount > 0 ? 'up' : amount < 0 ? 'down' : 'flat';
  return {
    amount,
    relative: relativeChange(current, comparison),
    direction,
    favourable: direction === 'flat' ? null : amount > 0 === income,
  };
}

/**
 * The whole statement in one pass, every sum in minor units: section subtotals, then gross profit
 * (revenue less cost of sales), operating profit (less operating expenses), profit before tax (plus
 * other income, less other expenses) and net profit (less tax), with margins on revenue and the
 * change against the comparison period.
 */
export function profitAndLoss(lines: readonly PlLine[], currency: string): ProfitAndLoss {
  const hasComparison = lines.some((line) => line.comparison !== undefined);
  const minor = Object.fromEntries(
    PL_SECTIONS.map((section) => [section, { current: 0, comparison: 0, lines: [] as PlLine[] }]),
  ) as Record<PlSection, { current: number; comparison: number; lines: PlLine[] }>;
  for (const line of lines) {
    const entry = minor[line.section];
    entry.current += toMinor(line.current, currency);
    entry.comparison += toMinor(line.comparison ?? 0, currency);
    entry.lines.push(line);
  }

  const figure = (current: number, comparison: number, income: boolean): PlFigure => ({
    current: fromMinor(current, currency),
    comparison: hasComparison ? fromMinor(comparison, currency) : null,
    change: hasComparison
      ? plChange(fromMinor(current, currency), fromMinor(comparison, currency), income, currency)
      : null,
  });

  const sections = Object.fromEntries(
    PL_SECTIONS.map((section) => [
      section,
      {
        section,
        lines: minor[section].lines,
        ...figure(minor[section].current, minor[section].comparison, isIncomeSection(section)),
      },
    ]),
  ) as Record<PlSection, PlSectionTotals>;

  const run = (key: 'current' | 'comparison') => {
    const s = (section: PlSection) => minor[section][key];
    const gross = s('revenue') - s('costOfSales');
    const operating = gross - s('operatingExpenses');
    const beforeTax = operating + s('otherIncome') - s('otherExpenses');
    const net = beforeTax - s('tax');
    return { revenue: s('revenue'), gross, operating, beforeTax, net };
  };
  const now = run('current');
  const then = run('comparison');

  const margins = (r: ReturnType<typeof run>) => ({
    gross: r.revenue === 0 ? null : r.gross / r.revenue,
    operating: r.revenue === 0 ? null : r.operating / r.revenue,
    net: r.revenue === 0 ? null : r.net / r.revenue,
  });

  return {
    sections,
    results: {
      grossProfit: figure(now.gross, then.gross, true),
      operatingProfit: figure(now.operating, then.operating, true),
      profitBeforeTax: figure(now.beforeTax, then.beforeTax, true),
      netProfit: figure(now.net, then.net, true),
    },
    margins: { current: margins(now), comparison: hasComparison ? margins(then) : null },
    hasComparison,
  };
}

/** The change of one account line against its comparison, or null when it has none. */
export function lineChange(line: PlLine, currency: string): PlChange | null {
  if (line.comparison === undefined) return null;
  return plChange(line.current, line.comparison, isIncomeSection(line.section), currency);
}

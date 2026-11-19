import { fromMinor, toMinor } from '../lib/finance';

export interface BudgetLine {
  id: string;
  category: string;
  /** Planned amount for the period, major units. */
  budget: number;
  /** Booked so far, major units. */
  actual: number;
}

/** Spending is good when under budget; income is good when over it. */
export type BudgetKind = 'expense' | 'revenue';

export interface Variance {
  /** Budget minus actual for expenses, actual minus budget for revenue: positive is favourable. */
  amount: number;
  /** `amount` against the budget; null for a zero budget. */
  relative: number | null;
  /** Where actual stands against budget, in plain words. */
  position: 'under' | 'over' | 'on';
  favourable: boolean | null;
}

/** Within this share of the budget a line reads as on budget. */
export const ON_BUDGET = 0.005;

export function variance(
  line: Pick<BudgetLine, 'budget' | 'actual'>,
  kind: BudgetKind,
  currency: string,
): Variance {
  const budget = toMinor(line.budget, currency);
  const actual = toMinor(line.actual, currency);
  const raw = actual - budget;
  const amount = kind === 'expense' ? -raw : raw;
  const relative = budget === 0 ? null : amount / Math.abs(budget);
  const on = budget === 0 ? raw === 0 : Math.abs(raw / budget) < ON_BUDGET;
  const position = on ? 'on' : raw > 0 ? 'over' : 'under';
  return {
    amount: fromMinor(amount, currency),
    relative,
    position,
    favourable: on ? null : amount > 0,
  };
}

export interface BudgetSummary {
  budget: number;
  actual: number;
  variance: Variance;
  /** Lines that went the wrong way. */
  unfavourable: number;
}

export function budgetSummary(
  lines: readonly BudgetLine[],
  kind: BudgetKind,
  currency: string,
): BudgetSummary {
  let budget = 0;
  let actual = 0;
  for (const line of lines) {
    budget += toMinor(line.budget, currency);
    actual += toMinor(line.actual, currency);
  }
  const totals = { budget: fromMinor(budget, currency), actual: fromMinor(actual, currency) };
  return {
    ...totals,
    variance: variance(totals, kind, currency),
    unfavourable: lines.filter((line) => variance(line, kind, currency).favourable === false)
      .length,
  };
}

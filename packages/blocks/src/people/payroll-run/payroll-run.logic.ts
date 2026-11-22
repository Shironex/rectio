import { fromMinor } from '../../lib/finance';
import type { Payout } from '../../payouts/payouts.logic';

/**
 * The checks a payroll run needs before it can be approved. The app does the payroll maths; this
 * only adds up what it passes in and tests that it holds together. Every amount is an integer in
 * the currency's minor units (cents, pence, yen), so the totals are exact sums of integers and a
 * run of a thousand payslips reconciles to the unit. Server safe.
 */

/** Where the run is: under review, approved and waiting to be paid, or paid. */
export type PayrollStatus = 'review' | 'approved' | 'paid';

export interface PayrollLine {
  id: string;
  person: { name: string; avatar?: string | undefined };
  /** Job title or team, under the name. */
  role?: string | undefined;
  /** Minor units: 412550 is €4,125.50. */
  gross: number;
  /** Tax, social security and other withholdings, as a positive amount in minor units. */
  deductions: number;
  /** What the person is paid: gross less deductions, in minor units. */
  net: number;
  /** What the person costs the company: gross plus the employer's contributions, in minor units. */
  employerCost: number;
  /** The account paid into, masked as you show it, such as `•• 4821`. Empty or null when missing. */
  bankAccount?: string | null | undefined;
}

/** Why a line stops the run from being approved. */
export type PayrollIssue = 'missing-bank' | 'negative-net' | 'mismatch' | 'invalid-amount';

export interface PayrollTotals {
  people: number;
  gross: number;
  deductions: number;
  net: number;
  employerCost: number;
}

export interface PayrollReview {
  totals: PayrollTotals;
  /** Issues by line id, only for lines that have one. */
  issues: ReadonlyMap<string, readonly PayrollIssue[]>;
  /** Lines with at least one issue. */
  flagged: number;
  /** True when gross less deductions is net for the whole run, as well as line by line. */
  reconciled: boolean;
  /** True when nothing stops approval. */
  ready: boolean;
}

const AMOUNTS = ['gross', 'deductions', 'net', 'employerCost'] as const;

/** Totals of the run and every line's issues. */
export function reviewPayroll(lines: readonly PayrollLine[]): PayrollReview {
  const totals: PayrollTotals = {
    people: lines.length,
    gross: 0,
    deductions: 0,
    net: 0,
    employerCost: 0,
  };
  const issues = new Map<string, PayrollIssue[]>();
  for (const line of lines) {
    const found: PayrollIssue[] = [];
    if (AMOUNTS.some((key) => !Number.isSafeInteger(line[key]))) found.push('invalid-amount');
    else {
      for (const key of AMOUNTS) totals[key] += line[key];
      if (line.gross - line.deductions !== line.net) found.push('mismatch');
    }
    if (Number.isFinite(line.net) && line.net < 0) found.push('negative-net');
    if (line.bankAccount == null || line.bankAccount.trim() === '') found.push('missing-bank');
    if (found.length > 0) issues.set(line.id, found);
  }
  const reconciled =
    ![...issues.values()].some(
      (found) => found.includes('invalid-amount') || found.includes('mismatch'),
    ) && totals.gross - totals.deductions === totals.net;
  return {
    totals,
    issues,
    flagged: issues.size,
    reconciled,
    ready: lines.length > 0 && issues.size === 0 && reconciled,
  };
}

/** How many lines have each issue, for the summary above the table. */
export function issueCounts(review: PayrollReview): Record<PayrollIssue, number> {
  const counts: Record<PayrollIssue, number> = {
    'missing-bank': 0,
    'negative-net': 0,
    mismatch: 0,
    'invalid-amount': 0,
  };
  for (const found of review.issues.values()) for (const issue of found) counts[issue] += 1;
  return counts;
}

/**
 * The run's net pay as payouts, one per person, for the Payouts block or a payment file: amounts
 * back in major units, scheduled for the pay day.
 */
export function payrollPayouts(
  lines: readonly PayrollLine[],
  payDate: Date,
  currency: string,
  reference?: string,
): Payout[] {
  return lines
    .filter((line) => line.net > 0)
    .map((line) => ({
      id: `payroll-${line.id}`,
      payee: line.person.name,
      amount: fromMinor(line.net, currency),
      method: 'bank-transfer' as const,
      ...(line.bankAccount == null || line.bankAccount === ''
        ? {}
        : { destination: line.bankAccount }),
      status: 'scheduled' as const,
      date: payDate,
      ...(reference === undefined ? {} : { reference }),
    }));
}

import { daysBetween, fromMinor, toMinor } from '../lib/finance';

export interface Receivable {
  id: string;
  customer: string;
  /** The invoice number, for the reader who drills in. */
  invoice: string;
  due: Date;
  /** What is still owed, major units. */
  outstanding: number;
}

export const AGING_BUCKETS = ['current', '1-30', '31-60', '61-90', '90+'] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number];

/** Days past due decide the bucket: not yet due (or due today) is current. */
export function agingBucket(due: Date, today: Date): AgingBucket {
  const late = daysBetween(due, today);
  if (late <= 0) return 'current';
  if (late <= 30) return '1-30';
  if (late <= 60) return '31-60';
  if (late <= 90) return '61-90';
  return '90+';
}

export type BucketAmounts = Record<AgingBucket, number>;

export interface CustomerAging {
  customer: string;
  buckets: BucketAmounts;
  total: number;
  /** Days past due of the customer's oldest open invoice; zero or less when none is late. */
  oldestDaysLate: number;
}

export interface AgingReport {
  buckets: BucketAmounts;
  total: number;
  /** Share of the total in each bucket, 0 to 1. */
  shares: BucketAmounts;
  /** Everything past due: every bucket but current. */
  overdue: number;
  /** Largest balance first. */
  customers: CustomerAging[];
}

const zero = (): BucketAmounts => ({ current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 });

export function agingReport(
  receivables: readonly Receivable[],
  today: Date,
  currency: string,
): AgingReport {
  const totals = zero();
  const customers = new Map<string, { buckets: BucketAmounts; oldest: number }>();
  for (const item of receivables) {
    const bucket = agingBucket(item.due, today);
    const minor = toMinor(item.outstanding, currency);
    totals[bucket] += minor;
    const entry = customers.get(item.customer) ?? { buckets: zero(), oldest: -Infinity };
    entry.buckets[bucket] += minor;
    entry.oldest = Math.max(entry.oldest, daysBetween(item.due, today));
    customers.set(item.customer, entry);
  }
  const major = (amounts: BucketAmounts): BucketAmounts =>
    Object.fromEntries(
      AGING_BUCKETS.map((bucket) => [bucket, fromMinor(amounts[bucket], currency)]),
    ) as BucketAmounts;
  const totalMinor = AGING_BUCKETS.reduce((sum, bucket) => sum + totals[bucket], 0);
  const shares = Object.fromEntries(
    AGING_BUCKETS.map((bucket) => [bucket, totalMinor === 0 ? 0 : totals[bucket] / totalMinor]),
  ) as BucketAmounts;
  return {
    buckets: major(totals),
    total: fromMinor(totalMinor, currency),
    shares,
    overdue: fromMinor(totalMinor - totals.current, currency),
    customers: [...customers]
      .map(([customer, entry]) => ({
        customer,
        buckets: major(entry.buckets),
        total: fromMinor(
          AGING_BUCKETS.reduce((sum, bucket) => sum + entry.buckets[bucket], 0),
          currency,
        ),
        oldestDaysLate: entry.oldest,
      }))
      .sort((a, b) => b.total - a.total || a.customer.localeCompare(b.customer)),
  };
}

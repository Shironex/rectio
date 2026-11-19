import { daysBetween, sumMoney } from '../lib/finance';

export type PayoutStatus = 'scheduled' | 'in-transit' | 'paid' | 'failed' | 'cancelled';

/** How the money travels. The block names each one through its messages. */
export type PayoutMethod = 'bank-transfer' | 'instant' | 'card' | 'wallet' | 'cheque';

export interface Payout {
  id: string;
  payee: string;
  /** Major units, always positive: a payout is money leaving. */
  amount: number;
  method: PayoutMethod;
  /** The account it goes to, masked as you show it, such as "•• 4821". */
  destination?: string;
  status: PayoutStatus;
  /**
   * The day that matters for the status: when it is scheduled to leave, when it is expected to
   * arrive (in transit), when it arrived (paid), or when it failed or was cancelled.
   */
  date: Date;
  /** What the bank said, for a failed payout, such as "Account closed". */
  failureReason?: string;
  /** Your own reference, such as a batch or a bill number. */
  reference?: string;
}

export type PayoutFilter = 'all' | PayoutStatus;

export const PAYOUT_FILTERS: readonly PayoutFilter[] = [
  'all',
  'scheduled',
  'in-transit',
  'paid',
  'failed',
  'cancelled',
];

export interface StatusTotal {
  count: number;
  amount: number;
}

export interface PayoutTotals {
  byStatus: Record<PayoutStatus, StatusTotal>;
  /** Scheduled to leave from today to `horizonDays` ahead, today included. */
  scheduledSoon: StatusTotal;
  /** Paid on or after `paidSince`. */
  paidInPeriod: StatusTotal;
  counts: Record<PayoutFilter, number>;
}

const empty = (): StatusTotal => ({ count: 0, amount: 0 });

/**
 * Totals per status, what is scheduled in the next days and what was paid in the period, every sum
 * exact to the minor unit.
 */
export function payoutTotals(
  payouts: readonly Payout[],
  today: Date,
  currency: string,
  {
    horizonDays = 7,
    paidSince = new Date(today.getFullYear(), today.getMonth(), 1),
  }: { horizonDays?: number; paidSince?: Date } = {},
): PayoutTotals {
  const amounts: Record<PayoutStatus, number[]> = {
    scheduled: [],
    'in-transit': [],
    paid: [],
    failed: [],
    cancelled: [],
  };
  const soon: number[] = [];
  const paid: number[] = [];
  for (const payout of payouts) {
    amounts[payout.status].push(payout.amount);
    const ahead = daysBetween(today, payout.date);
    if (payout.status === 'scheduled' && ahead >= 0 && ahead <= horizonDays) {
      soon.push(payout.amount);
    }
    if (payout.status === 'paid' && daysBetween(paidSince, payout.date) >= 0) {
      paid.push(payout.amount);
    }
  }
  const byStatus = {} as Record<PayoutStatus, StatusTotal>;
  for (const status of Object.keys(amounts) as PayoutStatus[]) {
    byStatus[status] = {
      count: amounts[status].length,
      amount: sumMoney(amounts[status], currency),
    };
  }
  return {
    byStatus,
    scheduledSoon:
      soon.length === 0 ? empty() : { count: soon.length, amount: sumMoney(soon, currency) },
    paidInPeriod:
      paid.length === 0 ? empty() : { count: paid.length, amount: sumMoney(paid, currency) },
    counts: {
      all: payouts.length,
      scheduled: byStatus.scheduled.count,
      'in-transit': byStatus['in-transit'].count,
      paid: byStatus.paid.count,
      failed: byStatus.failed.count,
      cancelled: byStatus.cancelled.count,
    },
  };
}

/** The next payout to leave or land: the earliest scheduled or in transit from today on. */
export function nextPayout(payouts: readonly Payout[], today: Date): Payout | undefined {
  let next: Payout | undefined;
  for (const payout of payouts) {
    if (payout.status !== 'scheduled' && payout.status !== 'in-transit') continue;
    if (daysBetween(today, payout.date) < 0) continue;
    if (next === undefined || payout.date.getTime() < next.date.getTime()) next = payout;
  }
  return next;
}

export function matchesPayoutFilter(status: PayoutStatus, filter: PayoutFilter): boolean {
  return filter === 'all' || status === filter;
}

const ORDER: Record<PayoutStatus, number> = {
  failed: 0,
  'in-transit': 1,
  scheduled: 2,
  paid: 3,
  cancelled: 4,
};

/**
 * The order a payouts screen reads in: failed first (they need you), then in transit and
 * scheduled soonest first, then paid and cancelled newest first.
 */
export function sortPayouts(payouts: readonly Payout[]): Payout[] {
  return payouts.toSorted((a, b) => {
    const byStatus = ORDER[a.status] - ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    const ahead = a.status === 'in-transit' || a.status === 'scheduled';
    return ahead ? a.date.getTime() - b.date.getTime() : b.date.getTime() - a.date.getTime();
  });
}

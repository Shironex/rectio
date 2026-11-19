import { describe, expect, it } from 'vitest';

import { nextPayout, payoutTotals, sortPayouts, type Payout } from '../src/index';

const d = (m: number, day: number) => new Date(2026, m - 1, day);
const TODAY = d(3, 19);

const p = (id: string, status: Payout['status'], date: Date, amount: number): Payout => ({
  id,
  payee: id,
  amount,
  method: 'bank-transfer',
  status,
  date,
});

const payouts: Payout[] = [
  p('soon', 'scheduled', d(3, 21), 1_200.1),
  p('edge', 'scheduled', d(3, 26), 0.2),
  p('later', 'scheduled', d(3, 27), 900),
  p('road', 'in-transit', d(3, 20), 4_120),
  p('paid-now', 'paid', d(3, 3), 2_000),
  p('paid-old', 'paid', d(2, 27), 5_000),
  p('bad', 'failed', d(3, 17), 640.05),
  p('off', 'cancelled', d(3, 2), 300),
];

describe('payout totals', () => {
  it('sums the next days, in transit, paid this month and failed in minor units', () => {
    const totals = payoutTotals(payouts, TODAY, 'EUR');
    expect(totals.scheduledSoon).toEqual({ count: 2, amount: 1_200.3 });
    expect(totals.byStatus['in-transit']).toEqual({ count: 1, amount: 4_120 });
    expect(totals.paidInPeriod).toEqual({ count: 1, amount: 2_000 });
    expect(totals.byStatus.failed).toEqual({ count: 1, amount: 640.05 });
    expect(totals.counts).toEqual({
      all: 8,
      scheduled: 3,
      'in-transit': 1,
      paid: 2,
      failed: 1,
      cancelled: 1,
    });
  });

  it('takes its own horizon and period start', () => {
    const totals = payoutTotals(payouts, TODAY, 'EUR', { horizonDays: 2, paidSince: d(2, 1) });
    expect(totals.scheduledSoon.count).toBe(1);
    expect(totals.paidInPeriod.amount).toBe(7_000);
  });
});

describe('next payout and order', () => {
  it('finds the earliest scheduled or in transit from today on', () => {
    expect(nextPayout(payouts, TODAY)?.id).toBe('road');
    expect(nextPayout([p('past', 'scheduled', d(3, 1), 1)], TODAY)).toBeUndefined();
  });

  it('puts failed first, then upcoming soonest first, then history newest first', () => {
    expect(sortPayouts(payouts).map((x) => x.id)).toEqual([
      'bad',
      'road',
      'soon',
      'edge',
      'later',
      'paid-now',
      'paid-old',
      'off',
    ]);
  });
});

import { describe, expect, it } from 'vitest';

import {
  agingBucket,
  agingReport,
  aggregateCashFlow,
  approvalReducer,
  budgetSummary,
  canTransition,
  daysBetween,
  documentTotals,
  invoiceState,
  invoiceTotals,
  journalTotals,
  kpiDelta,
  minorDigits,
  pendingTotal,
  periodRange,
  reasonError,
  runningBalances,
  sumMoney,
  summarizeCashFlow,
  toMinor,
  unbalancedEntries,
  variance,
  type ApprovalState,
  type ExpenseRequest,
  type InvoiceSummary,
  type JournalLine,
  type Kpi,
} from '../src/index';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('money', () => {
  it('knows the minor digits of a currency', () => {
    expect(minorDigits('EUR')).toBe(2);
    expect(minorDigits('PLN')).toBe(2);
    expect(minorDigits('JPY')).toBe(0);
  });

  it('adds in minor units, so float drift never reaches a total', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(sumMoney([0.1, 0.2], 'EUR')).toBe(0.3);
    expect(sumMoney([1_234.565, 0.005], 'EUR')).toBe(1_234.58);
  });

  it('rounds half away from zero', () => {
    expect(toMinor(1.005, 'EUR')).toBe(101);
    expect(toMinor(-1.005, 'EUR')).toBe(-101);
  });

  it('counts calendar days, whatever the time of day', () => {
    expect(daysBetween(new Date(2026, 2, 1, 23, 0), new Date(2026, 2, 2, 1, 0))).toBe(1);
    expect(daysBetween(d(2026, 3, 19), d(2026, 2, 19))).toBe(-28);
  });
});

describe('invoice detail totals', () => {
  const line = (id: string, quantity: number, unitPrice: number, taxRate: number) => ({
    id,
    description: id,
    quantity,
    unitPrice,
    taxRate,
  });

  it('rounds each line, then VAT once per rate on the summed nets', () => {
    // Three lines of 0.333 at 23%: per-line VAT would round 0.08 three times (0.24); summed it is 0.23.
    const totals = documentTotals(
      [line('a', 1, 0.333, 0.23), line('b', 1, 0.333, 0.23), line('c', 1, 0.333, 0.23)],
      [],
      'EUR',
    );
    expect(totals.lineNets).toEqual([0.33, 0.33, 0.33]);
    expect(totals.subtotal).toBe(0.99);
    expect(totals.vat).toEqual([{ rate: 0.23, net: 0.99, vat: 0.23 }]);
    expect(totals.total).toBe(1.22);
  });

  it('groups VAT by rate, highest first, and takes payments off the balance', () => {
    const totals = documentTotals(
      [line('a', 40, 186, 0.23), line('b', 25, 12.9, 0.08), line('c', 1, 1_450, 0.23)],
      [{ id: 'p', date: d(2026, 2, 20), amount: 5_000, method: 'Bank transfer' }],
      'EUR',
    );
    expect(totals.vat.map((g) => g.rate)).toEqual([0.23, 0.08]);
    expect(totals.vat[0]).toEqual({ rate: 0.23, net: 8_890, vat: 2_044.7 });
    expect(totals.vat[1]).toEqual({ rate: 0.08, net: 322.5, vat: 25.8 });
    expect(totals.subtotal).toBe(9_212.5);
    expect(totals.total).toBe(11_283);
    expect(totals.balance).toBe(6_283);
  });

  it('keeps a credit line negative through VAT', () => {
    const totals = documentTotals([line('a', 1, 100, 0.23), line('b', -1, 20, 0.23)], [], 'PLN');
    expect(totals.subtotal).toBe(80);
    expect(totals.vatTotal).toBe(18.4);
  });
});

describe('invoice list', () => {
  const today = d(2026, 3, 19);
  const invoice = (over: Partial<InvoiceSummary>): InvoiceSummary => ({
    id: 'x',
    number: 'INV-1',
    customer: 'A',
    issued: d(2026, 2, 1),
    due: d(2026, 3, 1),
    total: 100,
    status: 'sent',
    ...over,
  });

  it('reads overdue from the due date, and due today is not late', () => {
    expect(invoiceState(invoice({}), today)).toBe('overdue');
    expect(invoiceState(invoice({ due: today }), today)).toBe('due');
    expect(invoiceState(invoice({ status: 'paid' }), today)).toBe('paid');
    expect(invoiceState(invoice({ status: 'void' }), today)).toBe('void');
  });

  it('sums open balances, part payments taken off, void and drafts left out', () => {
    const totals = invoiceTotals(
      [
        invoice({ id: '1', total: 100, amountPaid: 40 }),
        invoice({ id: '2', total: 50.05, due: d(2026, 4, 1) }),
        invoice({ id: '3', total: 999, status: 'void' }),
        invoice({ id: '4', total: 70, status: 'draft' }),
        invoice({ id: '5', total: 25, status: 'paid' }),
      ],
      today,
      'EUR',
    );
    expect(totals.outstanding).toBe(110.05);
    expect(totals.overdue).toBe(60);
    expect(totals.paid).toBe(25);
    expect(totals.counts).toEqual({ all: 5, outstanding: 2, overdue: 1, paid: 1, draft: 1 });
  });

  it('finds the quarter around today', () => {
    expect(periodRange('quarter', today)).toEqual({ from: d(2026, 1, 1), to: d(2026, 3, 31) });
    expect(periodRange('all', today)).toBeNull();
  });
});

describe('ledger', () => {
  const posting = (
    id: string,
    entryId: string,
    date: Date,
    accountCode: string,
    debit: number,
    credit: number,
  ): JournalLine => ({
    id,
    entryId,
    date,
    reference: entryId.toUpperCase(),
    description: entryId,
    accountCode,
    debit,
    credit,
  });

  const lines = [
    posting('1', 'e2', d(2026, 3, 4), '1000', 300.1, 0),
    posting('2', 'e2', d(2026, 3, 4), '4000', 0, 300.1),
    posting('3', 'e1', d(2026, 3, 2), '1000', 0, 0.2),
    posting('4', 'e1', d(2026, 3, 2), '6100', 0.2, 0),
  ];

  it('balances debits against credits', () => {
    expect(journalTotals(lines, 'EUR')).toEqual({
      debit: 300.3,
      credit: 300.3,
      difference: 0,
      balanced: true,
    });
    expect(unbalancedEntries(lines, 'EUR')).toEqual([]);
  });

  it('names the entry that does not balance', () => {
    const broken = [...lines, posting('5', 'e3', d(2026, 3, 5), '1000', 10, 0)];
    expect(journalTotals(broken, 'EUR').balanced).toBe(false);
    expect(unbalancedEntries(broken, 'EUR')).toEqual([
      { entryId: 'e3', reference: 'E3', difference: 10 },
    ]);
  });

  it('runs a balance in date order with the sign of the normal side', () => {
    const bank = lines.filter((l) => l.accountCode === '1000');
    const debitNormal = runningBalances(bank, { normal: 'debit' }, 100, 'EUR');
    expect(debitNormal.map((r) => r.balance)).toEqual([99.8, 399.9]);
    const revenue = lines.filter((l) => l.accountCode === '4000');
    expect(runningBalances(revenue, { normal: 'credit' }, 0, 'EUR')[0]?.balance).toBe(300.1);
  });
});

describe('cash flow', () => {
  const points = [
    { month: d(2026, 1, 1), inflow: 10.1, outflow: 20 },
    { month: d(2026, 2, 1), inflow: 30.2, outflow: 5 },
    { month: d(2026, 4, 1), inflow: 1, outflow: 0 },
  ];

  it('rolls months into quarters', () => {
    const quarters = aggregateCashFlow(points, 'quarter', 'EUR');
    expect(quarters.map((q) => [q.inflow, q.outflow, q.net])).toEqual([
      [40.3, 25, 15.3],
      [1, 0, 1],
    ]);
  });

  it('counts the months that ended positive', () => {
    const months = aggregateCashFlow(points, 'month', 'EUR');
    expect(summarizeCashFlow(months, 'EUR')).toEqual({
      inflow: 41.3,
      outflow: 25,
      net: 16.3,
      positive: 2,
    });
  });
});

describe('KPI delta', () => {
  const kpi = (over: Partial<Kpi>): Kpi => ({
    id: 'k',
    label: 'K',
    value: 110,
    previous: 100,
    format: 'money',
    better: 'up',
    series: [],
    ...over,
  });

  it('says the direction and whether it is good news', () => {
    expect(kpiDelta(kpi({}))).toEqual({ direction: 'up', change: 0.1, favourable: true });
    expect(kpiDelta(kpi({ better: 'down' })).favourable).toBe(false);
    expect(kpiDelta(kpi({ value: 100 }))).toEqual({
      direction: 'flat',
      change: 0,
      favourable: null,
    });
  });

  it('measures percentages in points, and a zero base has no relative change', () => {
    expect(kpiDelta(kpi({ format: 'percent', value: 0.25, previous: 0.2 })).change).toBeCloseTo(
      0.05,
    );
    expect(kpiDelta(kpi({ previous: 0 })).change).toBeNull();
  });
});

describe('AR aging', () => {
  const today = d(2026, 3, 19);

  it('buckets by days past due, edges included', () => {
    expect(agingBucket(today, today)).toBe('current');
    expect(agingBucket(d(2026, 3, 18), today)).toBe('1-30');
    expect(agingBucket(d(2026, 2, 17), today)).toBe('1-30');
    expect(agingBucket(d(2026, 2, 16), today)).toBe('31-60');
    expect(agingBucket(d(2026, 1, 18), today)).toBe('31-60');
    expect(agingBucket(d(2026, 1, 17), today)).toBe('61-90');
    expect(agingBucket(d(2025, 12, 19), today)).toBe('61-90');
    expect(agingBucket(d(2025, 12, 18), today)).toBe('90+');
  });

  it('totals per bucket and per customer, largest balance first', () => {
    const report = agingReport(
      [
        { id: '1', customer: 'B', invoice: '1', due: d(2026, 4, 1), outstanding: 100.1 },
        { id: '2', customer: 'A', invoice: '2', due: d(2026, 3, 1), outstanding: 50.2 },
        { id: '3', customer: 'A', invoice: '3', due: d(2025, 11, 1), outstanding: 200 },
      ],
      today,
      'EUR',
    );
    expect(report.buckets).toEqual({
      current: 100.1,
      '1-30': 50.2,
      '31-60': 0,
      '61-90': 0,
      '90+': 200,
    });
    expect(report.total).toBe(350.3);
    expect(report.overdue).toBe(250.2);
    expect(report.customers.map((c) => [c.customer, c.total, c.oldestDaysLate])).toEqual([
      ['A', 250.2, 138],
      ['B', 100.1, -13],
    ]);
    expect(Object.values(report.shares).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
});

describe('budget variance', () => {
  it('treats under budget as good for spending and over as good for revenue', () => {
    expect(variance({ budget: 1_000, actual: 900 }, 'expense', 'EUR')).toEqual({
      amount: 100,
      relative: 0.1,
      position: 'under',
      favourable: true,
    });
    expect(variance({ budget: 1_000, actual: 900 }, 'revenue', 'EUR')).toEqual({
      amount: -100,
      relative: -0.1,
      position: 'under',
      favourable: false,
    });
  });

  it('reads a hair off as on budget, and a zero budget has no relative variance', () => {
    expect(variance({ budget: 1_000, actual: 1_004 }, 'expense', 'EUR').position).toBe('on');
    expect(variance({ budget: 0, actual: 50 }, 'expense', 'EUR')).toMatchObject({
      relative: null,
      position: 'over',
      favourable: false,
    });
  });

  it('sums the lines and counts the ones that went the wrong way', () => {
    const summary = budgetSummary(
      [
        { id: '1', category: 'A', budget: 100.1, actual: 120 },
        { id: '2', category: 'B', budget: 200.2, actual: 150 },
      ],
      'expense',
      'EUR',
    );
    expect(summary).toMatchObject({ budget: 300.3, actual: 270, unfavourable: 1 });
    expect(summary.variance.amount).toBe(30.3);
  });
});

describe('expense approval', () => {
  const at = d(2026, 3, 19);
  const request = (id: string, status: ExpenseRequest['status'] = 'pending'): ExpenseRequest => ({
    id,
    employee: 'E',
    merchant: `M${id}`,
    category: 'Travel',
    date: d(2026, 3, 10),
    amount: 10.1,
    status,
  });
  const start: ApprovalState = { requests: [request('a'), request('b'), request('c')], events: [] };

  it('allows deciding a pending request and reopening a decided one, nothing else', () => {
    expect(canTransition('pending', 'approve')).toBe(true);
    expect(canTransition('pending', 'reopen')).toBe(false);
    expect(canTransition('approved', 'reject')).toBe(false);
    expect(canTransition('rejected', 'reopen')).toBe(true);
  });

  it('approves in bulk and writes one audit event per request', () => {
    const next = approvalReducer(start, { type: 'approve', ids: ['a', 'b'], actor: 'Ola', at });
    expect(next.requests.map((r) => r.status)).toEqual(['approved', 'approved', 'pending']);
    expect(next.events.map((e) => [e.requestId, e.action, e.actor])).toEqual([
      ['a', 'approved', 'Ola'],
      ['b', 'approved', 'Ola'],
    ]);
    expect(pendingTotal(next.requests, 'EUR')).toBe(10.1);
  });

  it('refuses a rejection without a real reason', () => {
    expect(reasonError('  ')).not.toBeNull();
    expect(reasonError('no')).not.toBeNull();
    expect(
      approvalReducer(start, { type: 'reject', ids: ['a'], actor: 'Ola', at, reason: 'no' }),
    ).toBe(start);
    const next = approvalReducer(start, {
      type: 'reject',
      ids: ['a'],
      actor: 'Ola',
      at,
      reason: '  Receipt missing  ',
    });
    expect(next.requests[0]?.status).toBe('rejected');
    expect(next.events[0]?.reason).toBe('Receipt missing');
  });

  it('skips requests that cannot move, and reopens a decision', () => {
    const approved = approvalReducer(start, { type: 'approve', ids: ['a'], actor: 'Ola', at });
    const again = approvalReducer(approved, {
      type: 'reject',
      ids: ['a', 'b'],
      actor: 'Ola',
      at,
      reason: 'Over the limit',
    });
    expect(again.requests.map((r) => r.status)).toEqual(['approved', 'rejected', 'pending']);
    expect(again.events).toHaveLength(2);
    const reopened = approvalReducer(again, { type: 'reopen', id: 'a', actor: 'Ola', at });
    expect(reopened.requests[0]?.status).toBe('pending');
    expect(reopened.events.at(-1)?.action).toBe('reopened');
    expect(approvalReducer(reopened, { type: 'reopen', id: 'c', actor: 'Ola', at })).toBe(reopened);
  });
});

describe('niceTicks', () => {
  it('steps evenly from zero with headroom over the largest value', async () => {
    const { niceTicks } = await import('../src/lib/chart');
    expect(niceTicks(36_600)).toEqual([0, 10_000, 20_000, 30_000, 40_000]);
    expect(niceTicks(156_200)).toEqual([0, 50_000, 100_000, 150_000, 200_000]);
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});

import { describe, expect, it } from 'vitest';

import { lineChange, plChange, profitAndLoss, type PlLine } from '../src/index';

const line = (
  id: string,
  section: PlLine['section'],
  current: number,
  comparison?: number,
): PlLine => ({
  id,
  section,
  account: id,
  current,
  ...(comparison === undefined ? {} : { comparison }),
});

const subs = line('subs', 'revenue', 1_000.1, 900);
const hosting = line('hosting', 'costOfSales', 300.3, 280);
const lines: PlLine[] = [
  subs,
  line('services', 'revenue', 200.2, 250),
  hosting,
  line('salaries', 'operatingExpenses', 500, 450),
  line('interest', 'otherIncome', 10, 5),
  line('fx', 'otherExpenses', 20, 25),
  line('tax', 'tax', 80, 70),
];

describe('profit and loss', () => {
  it('sums each section in minor units', () => {
    const pl = profitAndLoss(lines, 'EUR');
    expect(pl.sections.revenue.current).toBe(1_200.3);
    expect(pl.sections.revenue.comparison).toBe(1_150);
    expect(pl.sections.costOfSales.lines).toHaveLength(1);
  });

  it('works down to the net line', () => {
    const { results } = profitAndLoss(lines, 'EUR');
    expect(results.grossProfit.current).toBe(900);
    expect(results.operatingProfit.current).toBe(400);
    expect(results.profitBeforeTax.current).toBe(390);
    expect(results.netProfit.current).toBe(310);
    expect(results.netProfit.comparison).toBe(1_150 - 280 - 450 + 5 - 25 - 70);
  });

  it('works out margins on revenue, null with no revenue', () => {
    const pl = profitAndLoss(lines, 'EUR');
    expect(pl.margins.current.gross).toBeCloseTo(900 / 1_200.3);
    expect(pl.margins.current.net).toBeCloseTo(310 / 1_200.3);
    expect(
      profitAndLoss([line('rent', 'operatingExpenses', 100)], 'EUR').margins.current.net,
    ).toBeNull();
  });

  it('reads a loss as a negative net line', () => {
    const pl = profitAndLoss(
      [line('r', 'revenue', 100), line('c', 'operatingExpenses', 160)],
      'EUR',
    );
    expect(pl.results.netProfit.current).toBe(-60);
  });

  it('has no comparison when no line carries one', () => {
    const pl = profitAndLoss([line('r', 'revenue', 100)], 'EUR');
    expect(pl.hasComparison).toBe(false);
    expect(pl.results.netProfit.comparison).toBeNull();
    expect(pl.results.netProfit.change).toBeNull();
  });

  it('calls a rise in revenue favourable and a rise in cost unfavourable', () => {
    expect(lineChange(subs, 'EUR')).toMatchObject({
      amount: 100.1,
      direction: 'up',
      favourable: true,
    });
    expect(lineChange(hosting, 'EUR')).toMatchObject({
      amount: 20.3,
      direction: 'up',
      favourable: false,
    });
    expect(lineChange(line('x', 'revenue', 5), 'EUR')).toBeNull();
  });

  it('measures change exactly and leaves the share null with nothing before', () => {
    expect(plChange(0.3, 0.1, true, 'EUR').amount).toBe(0.2);
    expect(plChange(50, 0, true, 'EUR')).toMatchObject({ relative: null, direction: 'up' });
    expect(plChange(50, 50, false, 'EUR')).toMatchObject({ direction: 'flat', favourable: null });
    expect(plChange(-20, -40, true, 'EUR').relative).toBe(0.5);
  });
});

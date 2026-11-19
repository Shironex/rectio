import { describe, expect, it } from 'vitest';

import { daysToDue, isTaxOverdue, taxOn, taxSummary, type TaxRateEntry } from '../src/index';

const d = (m: number, day: number) => new Date(2026, m - 1, day);

const entries: TaxRateEntry[] = [
  { id: 'zero', rate: 0, outputBase: 500, inputBase: 0 },
  { id: 'exempt', rate: 'exempt', outputBase: 300, inputBase: 100 },
  { id: 'std', rate: 0.23, outputBase: 1_000.05, inputBase: 400 },
  { id: 'red', rate: 0.08, outputBase: 200, inputBase: 50, inputTax: 4.01 },
];

describe('tax summary', () => {
  it('works out tax at each rate, rounded to the minor unit', () => {
    expect(taxOn(1_000.05, 0.23, 'EUR')).toBe(230.01);
    expect(taxOn(999, 'exempt', 'EUR')).toBe(0);
    expect(taxOn(10, 0.23, 'JPY')).toBe(2);
  });

  it('orders rates highest first with exempt last, and keeps given tax', () => {
    const summary = taxSummary(entries, 'EUR');
    expect(summary.rows.map((r) => r.id)).toEqual(['std', 'red', 'zero', 'exempt']);
    expect(summary.rows[1]?.inputTax).toBe(4.01);
    expect(summary.rows[0]?.net).toBe(230.01 - 92);
  });

  it('totals in minor units and reads payable or refund', () => {
    const summary = taxSummary(entries, 'EUR');
    expect(summary.outputTax).toBe(246.01);
    expect(summary.inputTax).toBe(96.01);
    expect(summary.net).toBe(150);
    expect(summary.position).toBe('payable');
    expect(
      taxSummary([{ id: 'a', rate: 0.23, outputBase: 0, inputBase: 100 }], 'EUR'),
    ).toMatchObject({
      net: -23,
      position: 'refund',
    });
    expect(taxSummary([], 'EUR').position).toBe('nil');
  });

  it('counts days to the due date', () => {
    expect(daysToDue(d(4, 25), d(3, 19))).toBe(37);
    expect(daysToDue(d(4, 25), d(4, 25))).toBe(0);
    expect(daysToDue(d(4, 25), d(4, 28))).toBe(-3);
  });

  it('is overdue only past the date with the return or the payment outstanding', () => {
    const due = d(4, 25);
    const late = d(4, 28);
    expect(isTaxOverdue('open', due, d(4, 25), 'payable')).toBe(false);
    expect(isTaxOverdue('open', due, late, 'refund')).toBe(true);
    expect(isTaxOverdue('ready', due, late, 'nil')).toBe(true);
    expect(isTaxOverdue('filed', due, late, 'payable')).toBe(true);
    expect(isTaxOverdue('filed', due, late, 'refund')).toBe(false);
    expect(isTaxOverdue('paid', due, late, 'payable')).toBe(false);
  });
});

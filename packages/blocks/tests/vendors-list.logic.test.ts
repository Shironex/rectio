import { describe, expect, it } from 'vitest';

import {
  foldSearchText,
  searchVendors,
  sortVendors,
  vendorFigures,
  vendorTotals,
  type Vendor,
} from '../src/index';

/** The first match. */
function first<T>(items: readonly T[]): T {
  const [item] = items;
  if (item === undefined) throw new Error('no match');
  return item;
}

const d = (m: number, day: number) => new Date(2026, m - 1, day);
const TODAY = d(3, 19);

const vendors: Vendor[] = [
  {
    id: 'v1',
    name: 'Łódź Print Works',
    contact: 'Agnieszka Wróbel',
    termsDays: 30,
    status: 'active',
    bills: [
      { id: 'b1', due: d(3, 10), amount: 1_000.1 },
      { id: 'b2', due: d(3, 22), amount: 500.2 },
      { id: 'b3', due: d(4, 18), amount: 2_000 },
    ],
  },
  {
    id: 'v2',
    name: 'Müller Kaffee',
    termsDays: 14,
    status: 'on-hold',
    bills: [{ id: 'b4', due: d(3, 19), amount: 80 }],
  },
  { id: 'v3', name: 'Atlas Cloud', termsDays: 60, status: 'archived', bills: [] },
];

describe('vendor figures', () => {
  it('splits a balance into overdue, due soon and the next due date', () => {
    expect(vendorFigures(first(vendors), TODAY, 'EUR')).toEqual({
      balance: 3_500.3,
      overdue: 1_000.1,
      overdueCount: 1,
      nextDue: d(3, 22),
      nextDueIn: 3,
      dueSoon: 500.2,
    });
  });

  it('counts due today as due soon, not overdue', () => {
    const figures = vendorFigures(vendors[1] ?? first(vendors), TODAY, 'EUR');
    expect(figures.overdue).toBe(0);
    expect(figures.dueSoon).toBe(80);
    expect(figures.nextDueIn).toBe(0);
  });

  it('totals every vendor', () => {
    expect(vendorTotals(vendors, TODAY, 'EUR')).toEqual({
      owed: 3_580.3,
      overdue: 1_000.1,
      overdueVendors: 1,
      dueSoon: 580.2,
      dueSoonVendors: 2,
      counts: { all: 3, active: 1, 'on-hold': 1, archived: 1 },
    });
  });
});

describe('vendor search and sort', () => {
  it('folds accents and the Polish ł', () => {
    expect(foldSearchText('Łódź')).toBe('lodz');
    expect(searchVendors(vendors, 'lodz').map((v) => v.id)).toEqual(['v1']);
    expect(searchVendors(vendors, 'muller').map((v) => v.id)).toEqual(['v2']);
    expect(searchVendors(vendors, 'wrobel print').map((v) => v.id)).toEqual(['v1']);
    expect(searchVendors(vendors, '  ')).toHaveLength(3);
  });

  it('sorts by a column, with nothing due last either way', () => {
    const opts = { today: TODAY, currency: 'EUR', locale: 'en-GB' };
    expect(sortVendors(vendors, 'name', opts).map((v) => v.id)).toEqual(['v3', 'v1', 'v2']);
    expect(sortVendors(vendors, 'balance', { ...opts, descending: true }).map((v) => v.id)).toEqual(
      ['v1', 'v2', 'v3'],
    );
    expect(sortVendors(vendors, 'nextDue', opts).map((v) => v.id)).toEqual(['v2', 'v1', 'v3']);
    expect(sortVendors(vendors, 'nextDue', { ...opts, descending: true }).map((v) => v.id)).toEqual(
      ['v1', 'v2', 'v3'],
    );
  });
});

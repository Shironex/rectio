import { describe, expect, it } from 'vitest';

import { averageBurn, cashRunway, type RunwayMonth } from '../src/index';

const m = (year: number, month: number, inflow: number, outflow: number): RunwayMonth => ({
  month: new Date(year, month - 1, 1),
  inflow,
  outflow,
});

// Nets: -10, -20, -30, -40 (thousands).
const history = [
  m(2025, 12, 90_000, 100_000),
  m(2026, 1, 80_000, 100_000),
  m(2026, 2, 70_000, 100_000),
  m(2026, 3, 60_000, 100_000),
];

describe('cash runway', () => {
  it('averages the burn over the last months of the window', () => {
    expect(averageBurn(history, 'EUR', 3)).toEqual({ burn: 30_000, net: -30_000, months: 3 });
    expect(averageBurn(history, 'EUR', 12)).toMatchObject({ burn: 25_000, months: 4 });
    expect(averageBurn([], 'EUR')).toEqual({ burn: 0, net: 0, months: 0 });
  });

  it('sums repeated months and orders them, in minor units', () => {
    const burn = averageBurn(
      [m(2026, 2, 0.1, 0), m(2026, 1, 0, 0.3), m(2026, 2, 0.2, 0)],
      'EUR',
      2,
    );
    expect(burn.net).toBe(0);
  });

  it('is balance over burn with nothing planned, and names the zero month', () => {
    const runway = cashRunway(history, 75_000, 'EUR');
    expect(runway.status).toBe('burning');
    expect(runway.months).toBeCloseTo(2.5);
    expect(runway.zeroMonth).toEqual(new Date(2026, 5, 1));
  });

  it('works the history back from today and projects toward zero', () => {
    const runway = cashRunway(history, 75_000, 'EUR');
    const actual = runway.series.filter((p) => p.kind === 'actual').map((p) => p.balance);
    expect(actual).toEqual([165_000, 145_000, 115_000, 75_000]);
    const projected = runway.series.filter((p) => p.kind === 'projected').map((p) => p.balance);
    expect(projected).toEqual([45_000, 15_000, -15_000]);
  });

  it('adds planned changes and finds the threshold month', () => {
    const runway = cashRunway(history, 75_000, 'EUR', {
      threshold: 50_000,
      planned: [{ month: new Date(2026, 4, 15), amount: 60_000, label: 'Grant' }],
    });
    expect(runway.thresholdMonth).toEqual(new Date(2026, 3, 1));
    expect(runway.series.find((p) => p.planned.length > 0)?.balance).toBe(75_000);
    expect(runway.months).toBeCloseTo(4.5);
  });

  it('is not burning when cash grows, and beyond the horizon when it lasts', () => {
    const growing = cashRunway([m(2026, 3, 10_000, 5_000)], 1_000, 'EUR');
    expect(growing).toMatchObject({ status: 'not-burning', months: null, zeroMonth: null });
    expect(growing.series).toHaveLength(1);
    const long = cashRunway(history, 10_000_000, 'EUR', { horizon: 12 });
    expect(long).toMatchObject({ status: 'beyond-horizon', months: null });
    expect(long.series.filter((p) => p.kind === 'projected')).toHaveLength(12);
  });
});

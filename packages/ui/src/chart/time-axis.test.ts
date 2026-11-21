import { describe, expect, it } from 'vitest';

import { formatValue, formatDuration, relativeChange } from './chart-format';
import {
  fillGaps,
  gapSpans,
  formatTick,
  inferTimeScale,
  mergeSeries,
  summarizeSeries,
  timeTicks,
  weeklyMeans,
} from './time-axis';

const day = (d: number, month = 2, year = 2026) => new Date(year, month, d);

describe('formatValue', () => {
  it('writes each format with the true minus sign', () => {
    expect(formatValue(-1234.5, 'number', { locale: 'en-GB' })).toBe('−1,234.5');
    expect(formatValue(0.243, 'percent', { locale: 'en-GB' })).toBe('24.3%');
    expect(formatValue(48210, 'currency', { locale: 'en-GB', currency: 'EUR' })).toBe('€48,210');
    expect(formatValue(48210.5, 'currency', { locale: 'en-GB', currency: 'EUR' })).toBe(
      '€48,210.50',
    );
    expect(
      formatValue(48210, 'currency', { locale: 'en-GB', currency: 'EUR', compact: true }),
    ).toBe('€48.2k');
    expect(formatValue(0.05, 'percent', { locale: 'en-GB', signed: true })).toBe('+5%');
  });

  it('writes durations in their two largest units', () => {
    expect(formatDuration(4800, 'en-GB')).toBe('1h 20m');
    expect(formatDuration(45, 'en-GB')).toBe('45s');
    expect(formatValue(4800, 'duration', { locale: 'en-GB', compact: true })).toBe('1h');
  });

  it('has no change from zero', () => {
    expect(relativeChange(10, 0)).toBeNull();
    expect(relativeChange(110, 100)).toBeCloseTo(0.1);
  });
});

describe('time axis', () => {
  it('merges series on one timeline in date order, with nulls where a series has no point', () => {
    const rows = mergeSeries([
      {
        id: 'a',
        points: [
          { date: day(2), value: 2 },
          { date: day(1), value: 1 },
        ],
      },
      { id: 'b', points: [{ date: day(2), value: 5 }] },
    ]);
    expect(rows.map((r) => r.values)).toEqual([
      { a: 1, b: null },
      { a: 2, b: 5 },
    ]);
  });

  it('infers the scale from the smallest step', () => {
    expect(inferTimeScale([{ time: 0 }, { time: 3_600_000 }])).toBe('hour');
    expect(inferTimeScale([{ time: day(1).getTime() }, { time: day(2).getTime() }])).toBe('day');
    expect(inferTimeScale([{ time: day(1, 0).getTime() }, { time: day(1, 1).getTime() }])).toBe(
      'month',
    );
  });

  it('breaks the line over a missing week but not over a weekend', () => {
    const series = (days: number[]) =>
      mergeSeries([{ id: 'a', points: days.map((d) => ({ date: day(d), value: d })) }]);
    expect(fillGaps(series([2, 3, 6, 7]), 'day').some((r) => r.gap)).toBe(false);
    const broken = fillGaps(series([2, 3, 4, 12, 13]), 'day');
    expect(broken.filter((r) => r.gap)).toHaveLength(1);
    expect(broken.find((r) => r.gap)?.values).toEqual({ a: null });
  });

  it('puts ticks on round calendar steps that fit the width', () => {
    const start = day(1, 0).getTime();
    const end = day(31, 11).getTime();
    const wide = timeTicks(start, end, 'day', 12);
    expect(wide.unit).toBe('month');
    expect(wide.ticks).toHaveLength(12);
    const narrow = timeTicks(start, end, 'day', 4);
    expect(narrow.ticks.map((t) => new Date(t).getMonth())).toEqual([0, 3, 6, 9]);
    const days = timeTicks(day(1).getTime(), day(30).getTime(), 'day', 6);
    expect(days.unit).toBe('day');
    expect(days.ticks.every((t) => new Date(t).getDay() === 1)).toBe(true);
  });

  it('names the year on month ticks only where it is needed', () => {
    const jan = day(1, 0, 2027).getTime();
    expect(formatTick(jan, 'month', 'en-GB', { crossesYear: true })).toBe('Jan 2027');
    expect(formatTick(day(1, 3).getTime(), 'month', 'en-GB', { crossesYear: true })).toBe('Apr');
    expect(formatTick(day(4).getTime(), 'day', 'en-GB')).toBe('4 Mar');
  });

  it('summarizes a series and skips gaps', () => {
    const summary = summarizeSeries([
      { date: day(1), value: 10 },
      { date: day(2), value: null },
      { date: day(3), value: 30 },
      { date: day(4), value: 20 },
    ]);
    expect(summary?.peak.value).toBe(30);
    expect(summary?.change).toBeCloseTo(1);
    expect(summarizeSeries([])).toBeNull();
  });
});

describe('narrow plots and gaps', () => {
  it('averages daily rows into weeks that start on Monday, a week with no figure a gap row', () => {
    // 2026-11-02 is a Monday.
    const day = (n: number) => new Date(2026, 10, n);
    const rows = [
      { time: day(2).getTime(), date: day(2), values: { a: 10 } },
      { time: day(4).getTime(), date: day(4), values: { a: 20 } },
      { time: day(9).getTime(), date: day(9), values: { a: null } },
    ];
    expect(weeklyMeans(rows)).toEqual([
      { time: day(2).getTime(), date: day(2), values: { a: 15 } },
      { time: day(9).getTime(), date: day(9), values: { a: null }, gap: true },
    ]);
  });

  it('spans each gap row from the moment before to the moment after', () => {
    const rows = [
      { time: 1, date: new Date(1), values: {} },
      { time: 2, date: new Date(2), values: {}, gap: true },
      { time: 9, date: new Date(9), values: {} },
    ];
    expect(gapSpans(rows)).toEqual([{ from: 1, to: 9 }]);
  });
});

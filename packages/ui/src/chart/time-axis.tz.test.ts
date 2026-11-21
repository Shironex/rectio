import { afterAll, describe, expect, it } from 'vitest';

import {
  fillGaps,
  formatMoment,
  gapSpans,
  inferTimeScale,
  localDate,
  mergeSeries,
  timeTicks,
  weeklyMeans,
  type TimePoint,
} from './time-axis';

// Node reads TZ again whenever it is set, so each block runs in a real zone with clock changes.
const original = process.env.TZ;
afterAll(() => {
  if (original === undefined) delete process.env.TZ;
  else process.env.TZ = original;
});

/** Local midnight on each day from `from` to `to`, both 'YYYY-MM-DD'. */
function days(from: string, to: string, skip: (date: Date) => boolean = () => false): TimePoint[] {
  const points: TimePoint[] = [];
  const end = localDate(to).getTime();
  for (
    const cursor = localDate(from);
    cursor.getTime() <= end;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    if (!skip(cursor)) points.push({ date: new Date(cursor), value: cursor.getDate() });
  }
  return points;
}

const rowsOf = (points: TimePoint[]) => mergeSeries([{ id: 'a', points }]);

describe.each([
  // Spring forward and fall back in each zone, 2026.
  {
    zone: 'Europe/Warsaw',
    spring: ['2026-03-01', '2026-05-29'],
    autumn: ['2026-10-01', '2026-11-30'],
  },
  {
    zone: 'America/New_York',
    spring: ['2026-02-15', '2026-04-30'],
    autumn: ['2026-10-01', '2026-11-30'],
  },
])('daily figures across clock changes in $zone', ({ zone, spring, autumn }) => {
  const setZone = () => {
    process.env.TZ = zone;
  };

  it('runs in the zone', () => {
    setZone();
    // Winter and summer offsets differ, so the zone is really in force.
    expect(new Date(2026, 0, 15).getTimezoneOffset()).not.toBe(
      new Date(2026, 6, 15).getTimezoneOffset(),
    );
  });

  it.each([
    ['spring', spring],
    ['autumn', autumn],
  ] as const)('stays on a daily scale with Monday weeks in %s', (_, range) => {
    setZone();
    const [from = '', to = ''] = range;
    const rows = rowsOf(days(from, to));
    expect(inferTimeScale(rows)).toBe('day');
    expect(fillGaps(rows, 'day').some((row) => row.gap === true)).toBe(false);

    const weeks = weeklyMeans(rows);
    for (const week of weeks) {
      expect(week.date.getDay()).toBe(1);
      expect(week.date.getHours()).toBe(0);
    }
    // One row per calendar week, none skipped or doubled by a 23 or 25 hour day.
    weeks.slice(1).forEach((week, index) => {
      const previous = weeks[index];
      const apart = previous === undefined ? 0 : (week.time - previous.time) / 86_400_000;
      expect(Math.round(apart)).toBe(7);
    });

    const first = rows[0];
    const last = rows.at(-1);
    const { ticks, unit } = timeTicks(first?.time ?? 0, last?.time ?? 0, 'day', 12);
    expect(unit).toBe('day');
    for (const tick of ticks) expect(new Date(tick).getHours()).toBe(0);
  });

  it('does not take a weekend over a clock change for a gap', () => {
    setZone();
    const weekdays = days(
      spring[0] ?? '',
      spring[1] ?? '',
      (d) => d.getDay() === 0 || d.getDay() === 6,
    );
    expect(fillGaps(rowsOf(weekdays), 'day').some((row) => row.gap === true)).toBe(false);
  });
});

describe('weekly averages over a missing month', () => {
  it('keeps a row for every empty week and breaks the line there', () => {
    process.env.TZ = 'Europe/Warsaw';
    // February 2026 is missing: 31 days with no figure from 1 Feb to 3 Mar.
    const points = days(
      '2026-01-05',
      '2026-03-29',
      (d) => d >= localDate('2026-02-01') && d < localDate('2026-03-04'),
    );
    const rows = rowsOf(points);
    const weeks = weeklyMeans(fillGaps(rows, 'day'));
    const empty = weeks.filter((week) => week.gap === true);
    expect(empty.length).toBe(4);
    for (const week of empty) expect(week.values.a).toBeNull();
    expect(gapSpans(weeks)).toHaveLength(1);
  });
});

describe('date-only strings in a zone behind UTC', () => {
  it('parse as the evening before, so callers build local dates with localDate', () => {
    process.env.TZ = 'America/New_York';
    expect(new Date('2026-03-01').getDate()).toBe(28);
    const date = localDate('2026-03-01');
    expect(date.getDate()).toBe(1);
    expect(formatMoment(date, 'day', 'en-GB')).toBe('1 Mar 2026');
    expect(Number.isNaN(localDate('2026-03-01T10:00').getTime())).toBe(true);
  });
});

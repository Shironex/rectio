import { describe, expect, it } from 'vitest';

import { breakdownModel, funnelInsight, goalPace, metricFigures } from '../src/analytics';

const day = (d: number) => new Date(2026, 10, d);

describe('metricFigures', () => {
  it('reads the latest figure, the change against the previous figure and the range', () => {
    const figures = metricFigures(
      [
        { date: day(3), value: 120 },
        { date: day(1), value: 100 },
        { date: day(2), value: null },
      ],
      96,
    );
    expect(figures).toMatchObject({
      latest: 120,
      first: 100,
      high: 120,
      low: 100,
      direction: 'up',
    });
    expect(figures?.change).toBeCloseTo(0.25);
  });

  it('compares with the first figure without a previous one, and is null with no figures', () => {
    expect(
      metricFigures([
        { date: day(1), value: 50 },
        { date: day(2), value: 40 },
      ]),
    ).toMatchObject({
      change: -0.2,
      direction: 'down',
    });
    expect(metricFigures([{ date: day(1), value: null }])).toBeNull();
  });
});

describe('breakdownModel', () => {
  const items = [
    { id: 'a', label: 'Alpha', value: 50, previous: 40 },
    { id: 'b', label: 'Beta', value: 30, previous: 30 },
    { id: 'c', label: 'Gamma', value: 15, previous: 20 },
    { id: 'd', label: 'Delta', value: 5, previous: 0 },
    { id: 'e', label: 'Epsilon', value: 0, previous: 2 },
  ];

  it('works out shares, changes and bar lengths, largest first', () => {
    const model = breakdownModel(items, { sort: { key: 'value', ascending: false }, locale: 'en' });
    expect(model.rows.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(model.rows[0]).toMatchObject({ share: 0.5, change: 0.25, length: 1 });
    expect(model.rows[3]?.change).toBeNull();
    expect(model.total).toBe(100);
    expect(model.totalChange).toBeCloseTo(100 / 92 - 1);
  });

  it('keeps the largest items past the limit and gathers the rest into a last other row', () => {
    const model = breakdownModel(items, {
      sort: { key: 'label', ascending: true },
      limit: 2,
      locale: 'en',
    });
    expect(model.rows.map((r) => r.id)).toEqual(['a', 'b', '__other']);
    expect(model.rows[2]).toMatchObject({ other: true, count: 3, value: 20, previous: 22 });
    expect(model.hidden).toBe(3);
  });

  it('treats a limit below zero or not a number as no limit', () => {
    for (const limit of [-1, Number.NaN]) {
      const model = breakdownModel(items, {
        sort: { key: 'value', ascending: false },
        limit,
        locale: 'en',
      });
      expect(model.rows).toHaveLength(5);
      expect(model.hidden).toBe(0);
    }
  });

  it('shows one item rather than an other row of one', () => {
    const model = breakdownModel(items, {
      sort: { key: 'value', ascending: false },
      limit: 4,
      locale: 'en',
    });
    expect(model.rows).toHaveLength(5);
    expect(model.hidden).toBe(0);
  });

  it('sinks rows without a change when sorting by change', () => {
    const model = breakdownModel(items, {
      sort: { key: 'change', ascending: false },
      locale: 'en',
    });
    expect(model.rows.map((r) => r.id)).toEqual(['a', 'b', 'c', 'e', 'd']);
  });
});

describe('funnelInsight', () => {
  it('names the conversion, its change in points and the step that loses the most', () => {
    const insight = funnelInsight(
      [
        { id: 'v', label: 'Visits', value: 1000 },
        { id: 's', label: 'Sign-ups', value: 200 },
        { id: 'p', label: 'Paid', value: 50 },
      ],
      [
        { id: 'v', label: 'Visits', value: 1000 },
        { id: 'p', label: 'Paid', value: 40 },
      ],
    );
    expect(insight.conversion).toBe(0.05);
    expect(insight.change).toBeCloseTo(0.01);
    expect(insight.biggestDrop).toMatchObject({ label: 'Sign-ups', from: 'Visits' });
    expect(insight.biggestDrop?.lost).toBeCloseTo(0.8);
  });

  it('reads an empty first stage as unknown, with no change, and counts negatives as zero', () => {
    const before = [
      { id: 'v', label: 'Visits', value: 100 },
      { id: 'p', label: 'Paid', value: 10 },
    ];
    const empty = funnelInsight(
      [
        { id: 'v', label: 'Visits', value: 0 },
        { id: 'p', label: 'Paid', value: 0 },
      ],
      before,
    );
    expect(empty.conversion).toBeNull();
    expect(empty.change).toBeNull();
    const negative = funnelInsight([
      { id: 'v', label: 'Visits', value: 200 },
      { id: 'p', label: 'Paid', value: -5 },
    ]);
    expect(negative.conversion).toBe(0);
    expect(funnelInsight([], before).change).toBeNull();
  });
});

describe('goalPace', () => {
  const goal = { target: 300, start: day(1), end: day(30) };

  it('compares the value with an even pace and projects the end', () => {
    const pace = goalPace({ ...goal, value: 150, today: day(10) });
    expect(pace.elapsed).toBeCloseTo(1 / 3);
    expect(pace.expected).toBeCloseTo(100);
    expect(pace.projected).toBeCloseTo(450);
    expect(pace.daysLeft).toBe(20);
    expect(pace.neededPerDay).toBeCloseTo(7.5);
    expect(pace.status).toBe('ahead');
  });

  it('is on track within the tolerance, behind under it, and met at the target', () => {
    expect(goalPace({ ...goal, value: 98, today: day(10) }).status).toBe('on-track');
    expect(goalPace({ ...goal, value: 60, today: day(10) }).status).toBe('behind');
    expect(goalPace({ ...goal, value: 300, today: day(10) })).toMatchObject({
      status: 'met',
      neededPerDay: null,
    });
  });

  it('has not started before the first day and has ended after the last', () => {
    expect(goalPace({ ...goal, value: 0, today: new Date(2026, 9, 20) })).toMatchObject({
      status: 'not-started',
      projected: null,
    });
    expect(goalPace({ ...goal, value: 200, today: new Date(2026, 11, 3) }).status).toBe('ended');
  });
});

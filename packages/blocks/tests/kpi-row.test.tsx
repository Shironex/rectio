import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { KpiRow, type Kpi } from '../src/index';

const kpi = (id: string): Kpi => ({
  id,
  label: id,
  value: 100,
  previous: 90,
  format: 'money',
  better: 'up',
  series: [80, 90, 100],
});

describe('KpiRow layout', () => {
  it('is one column on a phone and only splits from a wider block', () => {
    const { container } = render(
      <KpiRow
        kpis={[kpi('a'), kpi('b'), kpi('c')]}
        currency="EUR"
        locale="en-GB"
        comparison="vs February"
      />,
    );
    const grid = container.querySelector('dl');
    const classes = grid?.className.split(/\s+/) ?? [];
    // One column below the @xl container width (36rem), so a 390px phone never squeezes two figures.
    expect(classes).toContain('grid-cols-1');
    expect(classes).toContain('@xl:grid-cols-2');
    expect(classes.filter((c) => /^grid-cols-[2-9]/.test(c))).toEqual([]);
  });
});

describe('KpiRow formats', () => {
  it('writes counts, durations, currency and percentages, each with its change', () => {
    render(
      <KpiRow
        kpis={[
          { ...kpi('Active users'), format: 'number', value: 1284, previous: 1200 },
          {
            ...kpi('Median response'),
            format: 'duration',
            value: 4_800,
            previous: 6_000,
            better: 'down',
          },
          { ...kpi('MRR'), format: 'currency', value: 9_400, previous: 9_400 },
          { ...kpi('Churn'), format: 'percent', value: 0.021, previous: 0.025, better: 'down' },
        ]}
        currency="EUR"
        locale="en-GB"
        comparison="vs February"
      />,
    );
    const figure = (label: string) =>
      screen.getByText(label, { selector: 'dt' }).nextElementSibling;
    expect(figure('Active users')).toHaveTextContent('1,284+7%, better');
    expect(figure('Median response')).toHaveTextContent('1h 20m−20%, better');
    expect(figure('MRR')).toHaveTextContent('€9,400.00');
    expect(figure('Churn')).toHaveTextContent('2.1%−0.4 pts, better');
  });
});

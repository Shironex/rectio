import { render } from '@testing-library/react';
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

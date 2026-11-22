import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WaterfallChart } from './waterfall-chart';
import { waterfallBars } from './waterfall-chart.logic';

const data = [
  { id: 'open', label: 'Opening cash', value: 120000, kind: 'start' as const },
  { id: 'sales', label: 'Sales', value: 84000 },
  { id: 'payroll', label: 'Payroll', value: -61000 },
  { id: 'sub', label: 'Operating', kind: 'subtotal' as const },
  { id: 'tax', label: 'Tax', value: -9000 },
  { id: 'close', label: 'Closing cash', kind: 'end' as const },
];

describe('waterfallBars', () => {
  it('keeps the running total and stands totals from zero', () => {
    const bars = waterfallBars(data);
    expect(bars.map((bar) => bar.range)).toEqual([
      [0, 120000],
      [120000, 204000],
      [143000, 204000],
      [0, 143000],
      [134000, 143000],
      [0, 134000],
    ]);
    expect(bars.map((bar) => bar.role)).toEqual([
      'total',
      'increase',
      'decrease',
      'total',
      'decrease',
      'total',
    ]);
    expect(bars.at(-1)?.value).toBe(134000);
  });

  it('lets a total fall below zero', () => {
    const bars = waterfallBars([
      { id: 'a', label: 'A', value: 10, kind: 'start' },
      { id: 'b', label: 'B', value: -25 },
      { id: 'c', label: 'C', kind: 'end' },
    ]);
    expect(bars[2]?.range).toEqual([-15, 0]);
  });
});

describe('WaterfallChart', () => {
  it('summarises the bridge and lists every step with its sign in the table', () => {
    render(<WaterfallChart data={data} format="currency" currency="EUR" locale="en-GB" />);
    expect(
      screen.getByText(
        /From Opening cash €120,000 to Closing cash €134,000: €84,000 added and €70,000 taken away\. The largest step is Sales, \+€84,000\./,
      ),
    ).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Each step and the running total' });
    expect(within(table).getByRole('row', { name: /^Payroll/ })).toHaveTextContent(
      'Payroll−€61,000€143,000',
    );
  });

  it('keys increases, decreases and totals in the legend', () => {
    const { container } = render(<WaterfallChart data={data} locale="en-GB" />);
    expect(container.querySelector('[data-slot="chart-legend"]')).toHaveTextContent(
      'IncreaseDecreaseTotal',
    );
  });
});

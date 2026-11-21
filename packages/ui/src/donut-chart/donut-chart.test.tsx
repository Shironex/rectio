import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DonutChart } from './donut-chart';

const data = [
  { id: 'rent', label: 'Rent', value: 4000 },
  { id: 'payroll', label: 'Payroll', value: 9000 },
  { id: 'software', label: 'Software', value: 1200 },
  { id: 'travel', label: 'Travel', value: 500 },
  { id: 'meals', label: 'Meals', value: 200 },
  { id: 'refund', label: 'Refund', value: -300 },
];

describe('DonutChart', () => {
  it('lists every part by name, figure and share, with the total in the summary', () => {
    const { container } = render(<DonutChart data={data.slice(0, 3)} locale="en-GB" />);
    const legend = container.querySelector('[data-slot="donut-legend"]');
    expect(legend).toHaveTextContent('Payroll9,00063.4%');
    expect(screen.getByText(/A total of 14,200: Rent 4,000 \(28.2%\)/)).toBeInTheDocument();
  });

  it('folds the smallest parts into Other past maxSlices and leaves out negatives', () => {
    render(<DonutChart data={data} maxSlices={3} locale="en-GB" />);
    const table = screen.getByRole('table', { name: 'Shares of the total' });
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((h) => h.textContent),
    ).toEqual([
      'Rent',
      'Payroll',
      'Other',
      'Software, in Other',
      'Travel, in Other',
      'Meals, in Other',
      'Total',
    ]);
    expect(within(table).getByRole('row', { name: /^Other/ })).toHaveTextContent('Other1,900');
    expect(screen.queryByText('Refund')).toBeNull();
  });

  it('never repeats a colour: past three uncoloured parts the rest fold into Other', () => {
    const { container } = render(<DonutChart data={data} maxSlices={8} locale="en-GB" />);
    const legend = container.querySelector('[data-slot="donut-legend"]');
    expect(legend?.querySelectorAll('dt')).toHaveLength(4);
    expect(legend).toHaveTextContent('Other');
    // With a colour on every part, more slices may be drawn.
    const coloured = data.map((slice, index) => ({
      ...slice,
      color: (
        ['series-1', 'series-2', 'series-3', 'sequence-1', 'sequence-2', 'sequence-3'] as const
      )[index],
    }));
    const { container: own } = render(<DonutChart data={coloured} maxSlices={8} locale="en-GB" />);
    expect(own.querySelector('[data-slot="donut-legend"]')?.querySelectorAll('dt')).toHaveLength(5);
  });

  it('puts the total or your own figure in the middle', () => {
    const { rerender } = render(
      <DonutChart data={data.slice(0, 2)} format="currency" currency="EUR" locale="en-GB" />,
    );
    // The full total when it fits the hole, the short form only for a long one.
    expect(screen.getAllByText('€13,000').length).toBeGreaterThan(1);
    rerender(
      <DonutChart
        data={[
          { id: 'a', label: 'A', value: 900_000 },
          { id: 'b', label: 'B', value: 350_000 },
        ]}
        format="currency"
        currency="EUR"
        locale="en-GB"
      />,
    );
    expect(screen.getByText('€1.3m')).toBeInTheDocument();
    rerender(<DonutChart data={data.slice(0, 2)} centerValue="72%" centerLabel="Spent" />);
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('Spent')).toBeInTheDocument();
  });
});

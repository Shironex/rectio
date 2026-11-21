import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BarChart } from './bar-chart';

const data = [
  { team: 'Billing', open: 12, closed: 30 },
  { team: 'Support', open: 31, closed: 22 },
  { team: 'Platform', open: 4, closed: 9 },
];

describe('BarChart', () => {
  it('summarizes each series by its highest and lowest category', () => {
    render(
      <BarChart
        data={data}
        category="team"
        series={[
          { key: 'open', label: 'Open' },
          { key: 'closed', label: 'Closed' },
        ]}
        locale="en-GB"
      />,
    );
    expect(
      screen.getByText(/Open across 3 categories: highest Support at 31, lowest Platform at 4\./),
    ).toBeInTheDocument();
  });

  it('adds a total column for a stack and summarizes the totals', () => {
    render(
      <BarChart
        data={data}
        category="team"
        stacked
        orientation="horizontal"
        series={[
          { key: 'open', label: 'Open' },
          { key: 'closed', label: 'Closed' },
        ]}
        locale="en-GB"
      />,
    );
    const table = screen.getByRole('table', { name: 'Figures by category' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Category', 'Open', 'Closed', 'Total']);
    expect(within(table).getByRole('row', { name: /Support/ })).toHaveTextContent('Support312253');
    expect(
      screen.getByText(/Total across 3 categories: highest Support at 53/),
    ).toBeInTheDocument();
  });

  it('writes categories with formatCategory', () => {
    render(
      <BarChart
        data={[{ month: new Date(2026, 0, 1), revenue: 4200 }]}
        category="month"
        formatCategory={(value) =>
          value instanceof Date ? value.toLocaleDateString('en-GB', { month: 'long' }) : ''
        }
        series={[{ key: 'revenue', label: 'Revenue' }]}
        format="currency"
        currency="EUR"
        locale="en-GB"
      />,
    );
    expect(screen.getByRole('rowheader', { name: 'January' })).toBeInTheDocument();
    expect(screen.getByText('€4,200.00')).toBeInTheDocument();
  });

  it('shows the empty state with no data', () => {
    render(<BarChart data={[]} category="team" series={[{ key: 'open', label: 'Open' }]} />);
    expect(screen.getByText('Nothing to plot yet')).toBeInTheDocument();
  });
});

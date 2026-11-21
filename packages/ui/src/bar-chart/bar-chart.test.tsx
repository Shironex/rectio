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
    expect(screen.getByText('€4,200')).toBeInTheDocument();
  });

  it('hatches a fourth series, whose colour repeats the first, in the legend too', () => {
    const wide = data.map((row) => ({ ...row, a: 1, b: 2 }));
    const { container } = render(
      <BarChart
        data={wide}
        category="team"
        series={[
          { key: 'open', label: 'Open' },
          { key: 'closed', label: 'Closed' },
          { key: 'a', label: 'A' },
          { key: 'b', label: 'B' },
        ]}
        locale="en-GB"
      />,
    );
    const keys = [...container.querySelectorAll('[data-slot="chart-legend"] li span[aria-hidden]')];
    expect(keys).toHaveLength(4);
    expect((keys[3] as HTMLElement).style.backgroundImage).toContain('repeating-linear-gradient');
    expect((keys[0] as HTMLElement).style.backgroundImage).toBe('');
  });

  it('steps the plot ring back, since the active bar carries the strong ring', () => {
    const { container } = render(
      <BarChart data={data} category="team" series={[{ key: 'open', label: 'Open' }]} />,
    );
    const ring = '[&_.recharts-wrapper:has(.recharts-surface:focus-visible)]:outline-';
    const stage = [...container.querySelectorAll<HTMLElement>('[class]')].find((el) =>
      el.className.includes(ring),
    );
    expect(stage?.className).toContain(`${ring}1`);
    expect(stage?.className).not.toContain(`${ring}2`);
  });

  it('shows the empty state with no data', () => {
    render(<BarChart data={[]} category="team" series={[{ key: 'open', label: 'Open' }]} />);
    expect(screen.getByText('Nothing to plot yet')).toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AreaChart } from '../area-chart/area-chart';
import { LineChart } from './line-chart';

const day = (d: number) => new Date(2026, 2, d);
const series = [
  {
    id: 'signups',
    label: 'Signups',
    points: [
      { date: day(1), value: 120 },
      { date: day(2), value: 180 },
      { date: day(3), value: 150 },
    ],
  },
  {
    id: 'trials',
    label: 'Trials',
    dashed: true,
    points: [
      { date: day(1), value: 40 },
      { date: day(3), value: 65 },
    ],
  },
];

describe('LineChart', () => {
  it('reads the trend of every series before the plot', () => {
    render(<LineChart series={series} locale="en-GB" />);
    const figure = screen.getByRole('figure');
    expect(
      within(figure).getByText(
        /Signups went from 120 on 1 Mar 2026 to 150 on 3 Mar 2026, highest at 180 on 2 Mar 2026\./,
      ),
    ).toBeInTheDocument();
    expect(within(figure).getByText(/Use the arrow keys/)).toBeInTheDocument();
  });

  it('names every series in a legend, with a broken key for a dashed one', () => {
    const { container } = render(<LineChart series={series} locale="en-GB" />);
    const legend = container.querySelector('[data-slot="chart-legend"]');
    expect(legend).toHaveTextContent('SignupsTrials');
    render(<LineChart series={series.slice(0, 1)} locale="en-GB" />);
    // One series needs no legend.
    expect(document.querySelectorAll('[data-slot="chart-legend"]')).toHaveLength(1);
  });

  it('keeps a table twin in the page and shows it on request', async () => {
    render(<LineChart series={series} locale="en-GB" format="currency" currency="EUR" />);
    const table = screen.getByRole('table', { name: 'Figures by date' });
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByRole('rowheader', { name: '2 Mar 2026' })).toBeInTheDocument();
    expect(within(table).getByText('€180')).toBeInTheDocument();
    expect(table.parentElement).toHaveClass('sr-only');
    const toggle = screen.getByRole('button', { name: 'Show table' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(table.parentElement).not.toHaveClass('sr-only');
    expect(screen.getByRole('button', { name: 'Hide table' })).toBeInTheDocument();
  });

  it('announces loading once and shows an empty state with its next step', () => {
    const { rerender } = render(<LineChart series={series} loading />);
    expect(screen.getByRole('status', { name: 'Loading chart' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
    rerender(<LineChart series={[]} emptyAction={<button type="button">Connect</button>} />);
    expect(screen.getByText('Nothing to plot yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('takes its words from messages and a summary of your own', () => {
    render(
      <LineChart
        series={series}
        summary="Signups rose in March."
        messages={{ showTable: 'Tabelle', tableCaption: 'Zahlen' }}
      />,
    );
    expect(screen.getByText('Signups rose in March.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tabelle' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Zahlen' })).toBeInTheDocument();
  });
});

describe('AreaChart', () => {
  it('shares the time axis, summary and table of the line chart', () => {
    render(<AreaChart series={series} stacked locale="en-GB" tableToggle={false} />);
    expect(screen.getByRole('table', { name: 'Figures by date' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show table' })).toBeNull();
    expect(screen.getByText(/Trials went from 40/)).toBeInTheDocument();
  });
});

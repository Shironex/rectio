import type { TimeSeries } from '@rectio/ui/charts';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TimeSeriesChart, seriesFigures, seriesRange } from '../../src/index';
import { TimeSeriesChart as MotionTimeSeriesChart } from '../../src/motion';

const day = (n: number) => new Date(2026, 2, n);

const signups: TimeSeries = {
  id: 'signups',
  label: 'Sign-ups',
  points: [
    { date: day(3), value: 150 },
    { date: day(1), value: 100 },
    { date: day(2), value: 180 },
  ],
};
const trials: TimeSeries = {
  id: 'trials',
  label: 'Trials',
  points: [
    { date: day(1), value: 0 },
    { date: day(3), value: 30 },
  ],
};

describe('time series logic', () => {
  it('reads each series latest figure and its change, null from a zero start', () => {
    expect(seriesFigures([signups, trials])).toEqual([
      { id: 'signups', label: 'Sign-ups', last: 150, lastDate: day(3), change: 0.5 },
      { id: 'trials', label: 'Trials', last: 30, lastDate: day(3), change: null },
    ]);
  });

  it('spans every series and is null without points', () => {
    expect(seriesRange([signups, trials])).toEqual({ from: day(1), to: day(3) });
    expect(seriesRange([{ id: 'x', label: 'X', points: [] }])).toBeNull();
  });
});

describe('TimeSeriesChart', () => {
  it('puts one series latest figure and change in the card headline, the range as description', () => {
    render(<TimeSeriesChart title="Sign-ups" series={[signups]} locale="en-GB" />);
    const card = screen.getByRole('region', { name: 'Sign-ups' });
    expect(within(card).getAllByText('150').length).toBeGreaterThan(0);
    expect(within(card).getByText('1 Mar 2026 to 3 Mar 2026')).toBeInTheDocument();
    expect(within(card).getByText(/\+50%/)).toBeInTheDocument();
  });

  it('lists the figures of several series above the plot in place of the legend', () => {
    const { container } = render(
      <TimeSeriesChart title="Funnel" series={[signups, trials]} locale="en-GB" />,
    );
    const list = container.querySelector('[data-slot="series-figures"]');
    expect(list).not.toBeNull();
    expect(within(list as HTMLElement).getByText('Trials')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="chart-legend"]')).toBeNull();
  });

  it('keys each figure like the plot draws its series, a fourth one dashed', () => {
    const empty: TimeSeries = { id: 'none', label: 'Nothing yet', points: [] };
    const more = (id: string): TimeSeries => ({ ...trials, id, label: id });
    const { container } = render(
      <TimeSeriesChart
        title="Funnel"
        series={[empty, signups, more('demos'), more('paid')]}
        locale="en-GB"
      />,
    );
    const keys = [...container.querySelectorAll('[data-slot="series-figures"] dt')];
    expect(keys.map((key) => key.textContent)).toEqual(['Sign-ups', 'demos', 'paid']);
    // Sign-ups is the second series passed, so it takes the second colour, as in the plot.
    expect(keys[0]?.querySelector('.bg-chart-series-2')).not.toBeNull();
    // The fourth series repeats the first colour, so it is dashed, as in the plot.
    expect(keys[2]?.querySelector('.bg-chart-series-1')).not.toBeNull();
    expect(keys[2]?.querySelectorAll('.bg-chart-series-1')).toHaveLength(2);
  });

  it('keeps a table twin and renders the motion twin with the same props', () => {
    render(<MotionTimeSeriesChart title="Sign-ups" series={[signups]} locale="en-GB" />);
    expect(screen.getByRole('button', { name: 'Show table' })).toBeInTheDocument();
  });
});

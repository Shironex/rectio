import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  TimeSeriesChart,
  formatDuration,
  formatTick,
  formatValue,
  inferTimeScale,
  mergeSeries,
  pickTicks,
  summarizeSeries,
  type TimeSeries,
} from '../../src/index';
import { TimeSeriesChart as MotionTimeSeriesChart } from '../../src/motion';

const day = (n: number) => new Date(2026, 2, n);

const signups: TimeSeries = {
  id: 'signups',
  label: 'Sign-ups',
  points: [
    { date: day(3), value: 140 },
    { date: day(1), value: 100 },
    { date: day(2), value: 180 },
  ],
};
const trials: TimeSeries = {
  id: 'trials',
  label: 'Trials',
  points: [
    { date: day(1), value: 20 },
    { date: day(3), value: 30 },
  ],
};

describe('time series logic', () => {
  it('merges series on one timeline in date order, with a gap where a series has no point', () => {
    const rows = mergeSeries([signups, trials]);
    expect(rows.map((row) => row.date.getDate())).toEqual([1, 2, 3]);
    expect(rows[1]?.values).toEqual({ signups: 180, trials: null });
  });

  it('infers the scale from the smallest step', () => {
    expect(inferTimeScale(mergeSeries([signups]))).toBe('day');
    const hours = [0, 1, 2].map((h) => ({ time: new Date(2026, 2, 1, h).getTime() }));
    expect(inferTimeScale(hours)).toBe('hour');
    const months = [0, 1, 2].map((mo) => ({ time: new Date(2026, mo, 1).getTime() }));
    expect(inferTimeScale(months)).toBe('month');
  });

  it('writes ticks in the reader language and keeps the first and last moment', () => {
    expect(formatTick(day(4), 'day', 'en-GB')).toBe('4 Mar');
    expect(formatTick(day(4), 'month', 'en-GB', true)).toBe('Mar 26');
    const rows = Array.from({ length: 30 }, (_, i) => ({ time: i }));
    const ticks = pickTicks(rows, 6);
    expect(ticks[0]).toBe(0);
    expect(ticks.at(-1)).toBe(29);
    expect(ticks).toHaveLength(6);
  });

  it('summarises first, last, peak and the change across the series', () => {
    const summary = summarizeSeries(signups);
    expect(summary?.first.value).toBe(100);
    expect(summary?.last.value).toBe(140);
    expect(summary?.peak.value).toBe(180);
    expect(summary?.change).toBeCloseTo(0.4);
    expect(summarizeSeries({ id: 'x', label: 'X', points: [] })).toBeNull();
  });

  it('writes values in every format with a true minus sign', () => {
    expect(formatValue(1234.5, 'number', { locale: 'en-GB' })).toBe('1,234.5');
    expect(formatValue(0.245, 'percent', { locale: 'en-GB' })).toBe('24.5%');
    expect(formatValue(-12, 'currency', { locale: 'en-GB', currency: 'EUR' })).toBe('−€12.00');
    expect(formatValue(12_400, 'number', { locale: 'en-GB', compact: true })).toBe('12.4k');
    expect(formatDuration(4_800, 'en-GB')).toBe('1h 20m');
    expect(formatDuration(45, 'en-GB')).toBe('45s');
    expect(formatValue(90, 'duration', { locale: 'en-GB', signed: true })).toBe('+1m 30s');
  });
});

describe('TimeSeriesChart', () => {
  it('reads the latest figure, its change and a summary before the plot', () => {
    render(<TimeSeriesChart title="Sign-ups" series={[signups]} locale="en-GB" />);
    expect(screen.getByRole('heading', { name: 'Sign-ups' })).toBeInTheDocument();
    expect(screen.getByText('1 Mar 2026 to 3 Mar 2026')).toBeInTheDocument();
    expect(screen.getByText('Sign-ups', { selector: 'dt' }).nextElementSibling).toHaveTextContent(
      '140+40% over the range',
    );
    expect(screen.getByText('+40% over the range')).toBeInTheDocument();
    expect(screen.getByRole('figure').querySelector('figcaption')).toHaveTextContent(
      /Sign-ups went from 100 on 1 Mar 2026 to 140 on 3 Mar 2026, highest at 180 on 2 Mar 2026\./,
    );
  });

  it('keeps every figure in a table that opens on request', async () => {
    const user = userEvent.setup();
    render(<TimeSeriesChart series={[signups, trials]} locale="en-GB" />);
    const toggle = screen.getByRole('button', { name: 'Show table' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const table = screen.getByRole('table', { name: 'Figures by date' });
    expect(table).toHaveTextContent('2 Mar 2026180');
    expect(screen.getByRole('columnheader', { name: 'Trials' })).toBeInTheDocument();
  });

  it('announces a skeleton while loading and a next step when empty', () => {
    const { rerender } = render(<TimeSeriesChart series={[]} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading chart');
    rerender(<TimeSeriesChart series={[]} emptyAction={<button type="button">Connect</button>} />);
    expect(screen.getByRole('status')).toHaveTextContent('Nothing to plot yet');
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('writes currency figures and says when a series started from zero', () => {
    render(
      <TimeSeriesChart
        variant="area"
        format="currency"
        currency="EUR"
        locale="en-GB"
        series={[
          {
            id: 'mrr',
            label: 'MRR',
            points: [
              { date: day(1), value: 0 },
              { date: day(2), value: 900 },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByText('MRR', { selector: 'dt' }).nextElementSibling).toHaveTextContent(
      '€900.00Started from zero',
    );
  });

  it('renders the motion twin with the same content', () => {
    render(<MotionTimeSeriesChart series={[signups]} locale="en-GB" />);
    expect(screen.getByText('+40% over the range')).toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { BreakdownTable, FunnelCard, GoalTracker, MetricTrend } from '../src/analytics';
import * as moving from '../src/analytics/motion';

const POINTS = [
  { date: new Date(2026, 9, 1), value: 38200 },
  { date: new Date(2026, 9, 8), value: 41000 },
  { date: new Date(2026, 9, 15), value: 48210 },
];

const STAGES = [
  { id: 'v', label: 'Visits', value: 48210 },
  { id: 's', label: 'Sign-ups', value: 6120 },
  { id: 'p', label: 'Paid', value: 612 },
];

const ITEMS = [
  { id: 'organic', label: 'Organic search', value: 42180, previous: 38940 },
  { id: 'direct', label: 'Direct', value: 31260, previous: 32100 },
  { id: 'partners', label: 'Partners', value: 18420, previous: 14980 },
  { id: 'social', label: 'Social', value: 4210, previous: 4630 },
  { id: 'events', label: 'Events', value: 2980, previous: 0 },
];

describe('MetricTrend', () => {
  it('writes the latest figure and change, and names the line in words', () => {
    render(
      <MetricTrend
        label="MRR"
        points={POINTS}
        previous={40000}
        comparison="vs September"
        format="currency"
        currency="EUR"
        locale="en-GB"
      />,
    );
    expect(screen.getByRole('region', { name: 'MRR' })).toHaveTextContent('€48,210');
    expect(screen.getByText('vs September')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'MRR, rising from €38,200 to €48,210' }),
    ).toBeInTheDocument();
  });

  it('draws the stacked variant over a chart with its high and low', () => {
    render(<MetricTrend variant="stacked" label="MRR" points={POINTS} locale="en-GB" />);
    expect(screen.getByText('High 48,210, low 38,200')).toBeInTheDocument();
  });

  it('says so when there is no figure yet', () => {
    render(<MetricTrend label="MRR" points={[]} />);
    expect(screen.getByText('No figures yet')).toBeInTheDocument();
  });
});

describe('BreakdownTable', () => {
  it('lists each row with its figure, share and change, and a total', () => {
    render(
      <BreakdownTable
        title="Revenue by channel"
        items={ITEMS}
        format="currency"
        currency="EUR"
        locale="en-GB"
      />,
    );
    const table = screen.getByRole('table', { name: 'Revenue by channel' });
    const rows = within(table).getAllByRole('row');
    expect(rows[1]).toHaveTextContent(/^Organic search€42,180.*42\.6%/);
    expect(within(table).getByRole('row', { name: /^Total/ })).toHaveTextContent('€99,050');
  });

  it('sorts by a column and says the order with aria-sort', async () => {
    const user = userEvent.setup();
    render(<BreakdownTable items={ITEMS} locale="en-GB" />);
    await user.click(screen.getByRole('button', { name: 'Name' }));
    const header = screen.getByRole('columnheader', { name: 'Name' });
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Direct');
  });

  it('gathers rows past the limit into others, and shows them all on request', async () => {
    const user = userEvent.setup();
    render(<BreakdownTable items={ITEMS} limit={3} locale="en-GB" />);
    expect(screen.getByText('2 others')).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Show all 5' });
    await user.click(toggle);
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show fewer' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});

describe('FunnelCard', () => {
  it('heads the funnel with its conversion and names the biggest drop', () => {
    render(
      <FunnelCard
        stages={STAGES}
        previous={[
          { id: 'v', label: 'Visits', value: 1000 },
          { id: 'p', label: 'Paid', value: 11 },
        ]}
        locale="en-GB"
      />,
    );
    expect(screen.getByText('converted end to end')).toBeInTheDocument();
    expect(screen.getByText('Biggest drop: Sign-ups to Paid, 90% lost')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Each stage of the funnel' })).toBeInTheDocument();
  });
});

describe('GoalTracker', () => {
  const goal = {
    label: 'New ARR',
    value: 412000,
    target: 600000,
    start: new Date(2026, 9, 1),
    end: new Date(2026, 11, 31),
    today: new Date(2026, 10, 18),
    format: 'currency' as const,
    currency: 'EUR',
    locale: 'en-GB',
  };

  it('says the pace in words and lists the projection, days left and need', () => {
    render(<GoalTracker {...goal} />);
    expect(screen.getByText('Ahead of pace')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'New ARR' })).toBeInTheDocument();
    expect(screen.getByText('43 days')).toBeInTheDocument();
    expect(screen.getByText('€4,372')).toBeInTheDocument();
  });

  it('draws the bar variant as a meter with its value text', () => {
    render(<GoalTracker {...goal} variant="bar" value={200000} />);
    expect(screen.getByRole('meter', { name: 'New ARR' })).toHaveAttribute(
      'aria-valuetext',
      'New ARR: €200,000 of €600,000. Behind pace.',
    );
  });
});

describe('motion twins', () => {
  it('render the same content as the plain blocks', () => {
    render(
      <>
        <moving.MetricTrend label="MRR" points={POINTS} locale="en-GB" />
        <moving.BreakdownTable items={ITEMS} locale="en-GB" />
        <moving.FunnelCard stages={STAGES} locale="en-GB" />
        <moving.GoalTracker
          label="Goal"
          value={10}
          target={20}
          start={new Date(2026, 0, 1)}
          end={new Date(2026, 0, 31)}
          today={new Date(2026, 0, 10)}
        />
      </>,
    );
    expect(screen.getByRole('region', { name: 'MRR' })).toHaveTextContent('48,210');
    expect(screen.getByRole('meter', { name: 'Goal' })).toBeInTheDocument();
  });
});

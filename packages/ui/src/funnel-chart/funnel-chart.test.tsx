import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FunnelChart } from './funnel-chart';
import { funnelSteps } from './funnel-chart.logic';

const data = [
  { id: 'visits', label: 'Visits', value: 48210 },
  { id: 'signups', label: 'Sign-ups', value: 6120 },
  { id: 'trials', label: 'Trials', value: 2140 },
  { id: 'paid', label: 'Paid', value: 612 },
];

describe('funnelSteps', () => {
  it('works out conversion from the stage before and the first, and the drop-off', () => {
    const [first, second] = funnelSteps(data);
    expect(first).toMatchObject({ ofFirst: 1, ofPrevious: 1, dropped: 0, length: 1 });
    expect(second?.ofPrevious).toBeCloseTo(6120 / 48210);
    expect(second?.dropped).toBe(48210 - 6120);
    expect(second?.previousLength).toBe(1);
  });

  it('keeps an empty stage from dividing by zero and clamps negatives', () => {
    const steps = funnelSteps([
      { id: 'a', label: 'A', value: 10 },
      { id: 'b', label: 'B', value: -4 },
      { id: 'c', label: 'C', value: 3 },
    ]);
    expect(steps[1]?.value).toBe(0);
    expect(steps[2]?.ofPrevious).toBeNull();
  });
});

describe('FunnelChart', () => {
  it('writes every stage with its figure, share and the step between stages', () => {
    render(<FunnelChart data={data} locale="en-GB" />);
    const [list] = screen.getAllByRole('list').filter((el) => el.dataset.slot === 'funnel');
    if (list === undefined) throw new Error('no funnel list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[1]).toHaveTextContent('12.7% carried on, 42,090 left (87.3%)');
    expect(items[3]).toHaveTextContent('Paid6121.3%');
  });

  it('summarises the journey and names the biggest drop', () => {
    render(<FunnelChart data={data} locale="en-GB" />);
    expect(
      screen.getByText(
        /4 stages from Visits \(48,210\) to Paid \(612\), 1.3% overall\. The biggest drop is into Sign-ups, 87.3% lost\./,
      ),
    ).toBeInTheDocument();
  });

  it('has a table twin with every stage', () => {
    render(<FunnelChart data={data} locale="en-GB" orientation="vertical" />);
    const table = screen.getByRole('table', { name: 'Each stage of the funnel' });
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((h) => h.textContent),
    ).toEqual(['Visits', 'Sign-ups', 'Trials', 'Paid']);
    expect(within(table).getByRole('row', { name: /^Trials/ })).toHaveTextContent(
      'Trials2,14035%4.4%3,980',
    );
  });

  it('shows the empty state when the first stage is empty', () => {
    render(<FunnelChart data={[]} />);
    expect(screen.getByText('Nothing to plot yet')).toBeInTheDocument();
  });
});

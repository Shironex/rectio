import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Stat, StatGroup } from './stat';

describe('Stat', () => {
  it('pairs the label and the figure, and says the direction in words', () => {
    render(
      <Stat
        label="Active users"
        value="4,182"
        change={{ value: '12%', direction: 'up', favourable: true, comparison: 'vs last week' }}
      />,
    );
    expect(screen.getByRole('term')).toHaveTextContent('Active users');
    expect(screen.getAllByRole('definition')[0]).toHaveTextContent('4,182up 12%vs last week');
    expect(screen.getByText('12%').parentElement).toHaveClass('text-positive-strong');
  });

  it('colours a rise as bad news when it is, and stays neutral without a verdict', () => {
    render(
      <Stat
        label="Churn"
        value="2.1%"
        change={{ value: '0.4 pt', direction: 'up', favourable: false }}
      />,
    );
    expect(screen.getByText('0.4 pt').parentElement).toHaveClass('text-negative-strong');
    render(<Stat label="Tickets" value="31" change={{ value: '0', direction: 'flat' }} />);
    expect(screen.getByText('no change', { exact: false })).toBeInTheDocument();
  });

  it('sits in a group frame', () => {
    const { container } = render(
      <StatGroup>
        <Stat label="A" value="1" />
        <Stat label="B" value="2" />
      </StatGroup>,
    );
    expect(container.querySelectorAll('[data-slot="stat"]')).toHaveLength(2);
  });
});

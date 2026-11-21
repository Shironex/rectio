import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChartCard } from './chart-card';

describe('ChartCard', () => {
  it('is a region named by its title, with the figure read before the chart', () => {
    render(
      <ChartCard
        title="Revenue"
        description="Last 90 days"
        value="€48,210"
        delta={<span>+12%</span>}
        actions={<button type="button">Range</button>}
      >
        <p>chart</p>
      </ChartCard>,
    );
    const region = screen.getByRole('region', { name: 'Revenue' });
    expect(region).toHaveTextContent('RevenueLast 90 daysRange€48,210+12%chart');
    expect(screen.getByRole('heading', { level: 3, name: 'Revenue' })).toBeInTheDocument();
  });

  it('marks itself busy while the figure loads', () => {
    render(<ChartCard title="Churn" value="2%" loading headingLevel={2} />);
    expect(screen.getByRole('region', { name: 'Churn' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('2%')).toBeNull();
  });
});

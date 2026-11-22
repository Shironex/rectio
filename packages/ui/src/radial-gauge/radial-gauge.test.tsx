import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RadialGauge } from './radial-gauge';

const bands = [
  { to: 0.6, label: 'Behind' },
  { to: 0.9, label: 'On track' },
  { to: 1.2, label: 'Ahead' },
];

describe('RadialGauge', () => {
  it('is a meter whose value text names the figure, the target and the band', () => {
    render(
      <RadialGauge
        label="Quota attainment"
        value={0.82}
        max={1.2}
        target={1}
        bands={bands}
        format="percent"
        locale="en-GB"
      />,
    );
    const meter = screen.getByRole('meter', { name: 'Quota attainment' });
    expect(meter).toHaveAttribute('aria-valuenow', '0.82');
    expect(meter).toHaveAttribute(
      'aria-valuetext',
      'Quota attainment: 82% of 120%, target 100%, On track.',
    );
  });

  it('writes the share of the target under the figure and lists the bands', () => {
    const { container } = render(
      <RadialGauge
        label="Revenue"
        value={840000}
        max={1500000}
        target={1200000}
        bands={bands.map((band) => ({ ...band, to: band.to * 1000000 }))}
        format="currency"
        currency="EUR"
        locale="en-GB"
      />,
    );
    expect(screen.getByText('70% of target')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="gauge-legend"]')).toHaveTextContent(
      'Behind€0 to €600,000',
    );
  });

  it('clamps the arc to the scale', () => {
    const { container } = render(<RadialGauge label="Uptime" value={140} max={100} />);
    expect(container.querySelector('[data-chart-mark="sweep"]')).toHaveAttribute(
      'stroke-dasharray',
      '100 100',
    );
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

  it('keeps aria-valuenow on the scale and writes the real figure in the value text', () => {
    render(<RadialGauge label="Uptime" value={140} max={100} />);
    const meter = screen.getByRole('meter', { name: 'Uptime' });
    expect(meter).toHaveAttribute('aria-valuenow', '100');
    expect(meter).toHaveAttribute('aria-valuetext', 'Uptime: 140 of 100.');
  });

  it('sorts unsorted bands and names the band the value falls in', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container } = render(
      <RadialGauge
        label="Quota attainment"
        value={0.82}
        max={1.2}
        bands={[bands[2], bands[0], bands[1]].filter((band) => band !== undefined)}
        format="percent"
        locale="en-GB"
      />,
    );
    expect(screen.getByRole('meter')).toHaveAttribute(
      'aria-valuetext',
      'Quota attainment: 82% of 120%, On track.',
    );
    expect(container.querySelector('[data-slot="gauge-legend"]')).toHaveTextContent(
      'Behind0% to 60%On track60% to 90%Ahead90% to 120%',
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not in order'));
    warn.mockRestore();
  });

  it('clamps bands to the scale and drops a band that overlaps the one before', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container } = render(
      <RadialGauge
        label="Load"
        value={50}
        max={100}
        bands={[
          { to: -20, label: 'Below' },
          { to: 60, label: 'Fine' },
          { to: 60, label: 'Twice' },
          { to: 400, label: 'High' },
        ]}
      />,
    );
    const legend = container.querySelector('[data-slot="gauge-legend"]');
    expect(legend).toHaveTextContent('Fine0 to 60High60 to 100');
    expect(legend).not.toHaveTextContent('Below');
    expect(legend).not.toHaveTextContent('Twice');
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', 'Load: 50 of 100, Fine.');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('overlap'));
    warn.mockRestore();
  });

  it('draws a scale that is not a number as 0 to 1', () => {
    render(<RadialGauge label="Broken" value={0.5} min={Number.NaN} max={Number.NaN} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '1');
    expect(meter).toHaveAttribute('aria-valuenow', '0.5');
  });
});

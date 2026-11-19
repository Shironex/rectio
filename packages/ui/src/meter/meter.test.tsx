import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Meter, meterLevel } from './meter';

describe('meterLevel', () => {
  it('reads thresholds upward by default and downward when less is worse', () => {
    expect(meterLevel(50, { warning: 75, critical: 90 })).toBe('normal');
    expect(meterLevel(80, { warning: 75, critical: 90 })).toBe('warning');
    expect(meterLevel(95, { warning: 75, critical: 90 })).toBe('critical');
    expect(meterLevel(20, { warning: 40, critical: 25, worse: 'low' })).toBe('critical');
  });
});

describe('Meter', () => {
  it('is a meter named by its label, with the level in words in its value text', () => {
    render(
      <Meter
        value={92}
        label="Storage used"
        thresholds={{ warning: 75, critical: 90 }}
        levelLabels={{ critical: 'Nearly full' }}
      />,
    );
    const meter = screen.getByRole('meter', { name: 'Storage used' });
    expect(meter).toHaveAttribute('aria-valuetext', '92%, Nearly full');
    expect(meter).toHaveAttribute('data-level', 'critical');
    expect(screen.getByText('Nearly full')).toBeInTheDocument();
  });

  it('marks thresholds on the scale, as a gauge and as a bar', () => {
    const { container } = render(
      <Meter value={40} label="Budget" thresholds={{ warning: 75, critical: 90 }} />,
    );
    expect(container.querySelectorAll('line')).toHaveLength(2);
    const { container: bar } = render(
      <Meter value={40} label="Budget" variant="bar" thresholds={{ warning: 80 }} />,
    );
    expect(bar.querySelectorAll('[style*="inset-inline-start"]')).toHaveLength(1);
  });
});

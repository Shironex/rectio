import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Sparkline } from './sparkline';

describe('Sparkline', () => {
  it('is decorative unless it is given a label', () => {
    const { container } = render(<Sparkline data={[1, 3, 2]} />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    render(<Sparkline data={[1, 3, 2]} label="Revenue, rising over 3 months" />);
    expect(screen.getByRole('img', { name: 'Revenue, rising over 3 months' })).toBeInTheDocument();
  });

  it('leaves a gap where a figure is missing and marks the latest one', () => {
    const { container } = render(<Sparkline data={[1, 2, null, 4, 5]} area />);
    const line = container.querySelectorAll('path')[1];
    expect(line?.getAttribute('d')?.match(/M/g)).toHaveLength(2);
    const dot = container.querySelector('[data-part="dot"]');
    expect(dot).toHaveStyle({ left: '100%' });
  });

  it('draws nothing for no figures', () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(container.querySelector('svg')).toBeNull();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TrendChip, formatTrend } from './trend-chip';

describe('TrendChip', () => {
  it('says direction and verdict in words, colour only reinforcing', () => {
    const { container } = render(<TrendChip value={0.124} locale="en-GB" comparison="vs May" />);
    expect(container).toHaveTextContent('up +12.4%, bettervs May');
    expect(screen.getByText('+12.4%').parentElement).toHaveClass('text-positive-strong');
  });

  it('turns a rise into bad news when down is better, and stays neutral when flat', () => {
    render(<TrendChip value={0.02} better="down" />);
    expect(screen.getByText(/worse/)).toBeInTheDocument();
    render(<TrendChip value={0} />);
    expect(screen.getByText(/no change/)).toBeInTheDocument();
  });

  it('writes points and a figure of your own', () => {
    expect(formatTrend(-0.021, 'points', 'en-GB')).toBe('−2.1 pts');
    render(<TrendChip value={3} display="+3 days" better="none" variant="plain" />);
    expect(screen.getByText('+3 days').parentElement).toHaveClass('text-fg-muted');
  });
});

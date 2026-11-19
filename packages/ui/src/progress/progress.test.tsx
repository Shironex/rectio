import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Progress, progressShare } from './progress';

describe('progressShare', () => {
  it('clamps to 0..1 in any range', () => {
    expect(progressShare(50)).toBe(0.5);
    expect(progressShare(150)).toBe(1);
    expect(progressShare(-5)).toBe(0);
    expect(progressShare(3, 1, 5)).toBe(0.5);
    expect(progressShare(3, 5, 5)).toBe(0);
  });
});

describe('Progress', () => {
  it('is a progressbar named by its label, with the value read and shown', () => {
    render(<Progress value={64} label="Uploading statements" showValue />);
    const bar = screen.getByRole('progressbar', { name: 'Uploading statements' });
    expect(bar).toHaveAttribute('aria-valuenow', '64');
    expect(screen.getByText('64%')).toBeInTheDocument();
  });

  it('fills by scaling, never by width', () => {
    const { container } = render(<Progress value={25} aria-label="Import" />);
    const fill = container.querySelector<HTMLElement>('[data-slot="progress-fill"]');
    expect(fill?.style.transform).toBe('scaleX(0.25)');
    expect(fill?.style.width).toBe('');
  });

  it('has no value while indeterminate and a travelling band that breathes under reduced motion', () => {
    const { container } = render(<Progress value={null} aria-label="Preparing export" />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
    expect(container.querySelector('[data-slot="progress-indeterminate"]')).toHaveClass(
      'motion-reduce:animate-breathe',
    );
  });

  it('splits into segments and part-fills the one in progress', () => {
    const { container } = render(<Progress value={50} segments={4} aria-label="Setup" />);
    const segments = container.querySelectorAll('[data-slot="progress-segment"]');
    expect(segments).toHaveLength(4);
    expect(container.querySelectorAll('[data-filled]')).toHaveLength(2);
    const third = segments[2]?.firstElementChild as HTMLElement;
    expect(third.style.transform).toBe('scaleX(0)');
  });
});

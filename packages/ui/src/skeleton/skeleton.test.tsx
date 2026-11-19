import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Skeleton,
  SkeletonCard,
  SkeletonChart,
  SkeletonListItem,
  SkeletonSwap,
  SkeletonTable,
  SkeletonText,
} from './skeleton';

describe('Skeleton', () => {
  it('is hidden from assistive technology and shimmers by default', () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    const shape = container.querySelector('[data-slot="skeleton"]');
    expect(shape).toHaveAttribute('aria-hidden', 'true');
    expect(shape).toHaveAttribute('data-animation', 'shimmer');
    expect(shape?.querySelector('.animate-shimmer')).not.toBeNull();
  });

  it('stays still under reduced motion', () => {
    const { container } = render(<Skeleton animation="pulse" />);
    expect(container.firstElementChild).toHaveClass('motion-reduce:animate-none');
  });
});

describe('Skeleton presets', () => {
  it('announce loading once, as a busy status', () => {
    render(<SkeletonText lines={4} label="Loading the note" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Loading the note');
    expect(status.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(4);
  });

  it('draw the shape of what is coming', () => {
    const { container: table } = render(<SkeletonTable rows={3} columns={5} />);
    expect(table.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(20);
    const { container: list } = render(<SkeletonListItem count={2} />);
    expect(list.querySelectorAll('.rounded-full')).toHaveLength(2);
    const { container: chart } = render(<SkeletonChart points={7} />);
    expect(chart.querySelectorAll('.rounded-b-none')).toHaveLength(7);
    const { container: line } = render(<SkeletonChart kind="line" />);
    expect(line.querySelector('path[d^="M 0,"]')).not.toBeNull();
    render(<SkeletonCard label="Loading plan" />);
    expect(screen.getByText('Loading plan')).toHaveClass('sr-only');
  });

  it('send the light down a preset as a wave', () => {
    const { container } = render(<SkeletonText lines={3} />);
    const delays = [...container.querySelectorAll<HTMLElement>('.animate-shimmer')].map(
      (el) => el.style.animationDelay,
    );
    expect(new Set(delays).size).toBe(3);
  });
});

describe('SkeletonSwap', () => {
  it('shows the fallback while loading, then the content', () => {
    const { rerender, container } = render(
      <SkeletonSwap loading fallback={<SkeletonText />}>
        <p>Paid in full</p>
      </SkeletonSwap>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    rerender(
      <SkeletonSwap loading={false} fallback={<SkeletonText />}>
        <p>Paid in full</p>
      </SkeletonSwap>,
    );
    expect(screen.getByText('Paid in full')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

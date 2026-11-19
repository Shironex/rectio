import { SkeletonText } from '@rectio/ui';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  Alert,
  Banner,
  LoadingOverlay,
  Meter,
  MotionPreferenceProvider,
  Progress,
  ProgressCircle,
  SkeletonSwap,
  Timeline,
  TimelineItem,
} from '../src/index';

interface FakeAnimation {
  onfinish: (() => void) | null;
  cancel: () => void;
}

/** A browser that can animate. Each animation finishes when `finishAll` is called. */
function browser({ reduce = false } = {}) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion: reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  const animations: FakeAnimation[] = [];
  const animate = vi.fn(() => {
    const animation: FakeAnimation = { onfinish: null, cancel: vi.fn() };
    animations.push(animation);
    return animation;
  });
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate });
  const finishAll = () => {
    act(() => {
      for (const animation of animations.splice(0)) animation.onfinish?.();
    });
  };
  return { animate, finishAll };
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(Element.prototype, 'animate');
});

describe('measured values', () => {
  it('mark themselves for their entrance and keep the plain semantics', () => {
    browser();
    render(
      <>
        <Progress value={40} aria-label="Import" />
        <ProgressCircle value={70} label="Profile complete" />
        <Meter value={30} label="Storage used" />
      </>,
    );
    expect(screen.getByRole('progressbar', { name: 'Import' })).toHaveAttribute('data-motion');
    expect(screen.getByRole('progressbar', { name: 'Profile complete' })).toHaveAttribute(
      'data-motion',
    );
    expect(screen.getByRole('meter', { name: 'Storage used' })).toHaveAttribute('data-motion');
  });

  it('are the plain ones when motion is off', () => {
    browser();
    render(
      <MotionPreferenceProvider value="off">
        <ProgressCircle value={70} label="Profile complete" />
      </MotionPreferenceProvider>,
    );
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('data-motion');
  });
});

describe('Timeline', () => {
  it('is the same ordered list, marked for its cascade', () => {
    browser();
    render(
      <Timeline>
        <TimelineItem title="Sent" />
        <TimelineItem title="Paid" />
      </Timeline>,
    );
    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('data-motion');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});

describe('SkeletonSwap', () => {
  it('holds the placeholder over the arriving content until the crossfade ends', () => {
    const { finishAll } = browser();
    const view = (loading: boolean) => (
      <SkeletonSwap loading={loading} fallback={<SkeletonText label="Loading note" />}>
        <p>Paid in full</p>
      </SkeletonSwap>
    );
    const { rerender } = render(view(true));
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(view(false));
    expect(screen.getByText('Paid in full')).toBeInTheDocument();
    // The leaving placeholder is still drawn but no longer read.
    expect(screen.getByText('Loading note').closest('[aria-hidden="true"]')).not.toBeNull();
    finishAll();
    expect(screen.queryByText('Loading note')).not.toBeInTheDocument();
  });
});

describe('dismissible messages', () => {
  it('an alert stays for its exit, then goes and reports it', async () => {
    const { finishAll } = browser();
    const onDismiss = vi.fn();
    render(<Alert dismissible onDismiss={onDismiss} title="New export format" />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.getByText('New export format')).toBeInTheDocument();
    finishAll();
    expect(screen.queryByText('New export format')).not.toBeInTheDocument();
  });

  it('a banner does the same', async () => {
    const { finishAll } = browser();
    render(<Banner dismissible>Maintenance on Sunday.</Banner>);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss announcement' }));
    finishAll();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('the loading overlay fades out after it is no longer visible', () => {
    const { finishAll } = browser();
    const { rerender } = render(<LoadingOverlay visible label="Refreshing" />);
    rerender(<LoadingOverlay visible={false} label="Refreshing" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    finishAll();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

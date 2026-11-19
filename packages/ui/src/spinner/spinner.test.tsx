import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LoadingOverlay, Spinner, useLoadingAction, type SpinnerVariant } from './spinner';

describe('Spinner', () => {
  it.each<SpinnerVariant>(['ring', 'dots', 'bars', 'pulse', 'orbit'])(
    '%s is a status with a label and breathes under reduced motion',
    (variant) => {
      const { container } = render(<Spinner variant={variant} label="Loading invoices" />);
      expect(screen.getByRole('status')).toHaveTextContent('Loading invoices');
      expect(container.querySelector('.motion-reduce\\:animate-breathe')).not.toBeNull();
    },
  );

  it('can show its label, or hide entirely inside something already busy', () => {
    render(<Spinner label="Syncing" showLabel />);
    expect(screen.getByText('Syncing')).not.toHaveClass('sr-only');
    const { container } = render(<Spinner decorative />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild).not.toHaveAttribute('role');
  });
});

describe('LoadingOverlay', () => {
  it('renders only while visible, with one announced label', () => {
    const { rerender } = render(<LoadingOverlay visible={false} label="Refreshing rates" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    rerender(<LoadingOverlay visible label="Refreshing rates" />);
    expect(screen.getByRole('status')).toHaveTextContent('Refreshing rates');
  });
});

describe('useLoadingAction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('never shows loading for an action faster than the delay', async () => {
    const { result } = renderHook(() => useLoadingAction(() => Promise.resolve('ok')));
    let value: string | undefined;
    await act(async () => {
      value = await result.current.run();
    });
    expect(value).toBe('ok');
    expect(result.current.loading).toBe(false);
  });

  it('shows loading for a slow action, holds it for the minimum and ignores a second call', async () => {
    let finish: () => void = () => undefined;
    const action = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { result } = renderHook(() => useLoadingAction(action, { delay: 100, minimum: 400 }));
    let done: Promise<unknown> = Promise.resolve();
    act(() => {
      done = result.current.run();
      void result.current.run();
    });
    expect(action).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(result.current.loading).toBe(true);
    await act(async () => {
      finish();
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(result.current.loading).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
      await done;
    });
    expect(result.current.loading).toBe(false);
  });
});

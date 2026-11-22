import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNow } from '../../src/saas/lib/focus';

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 18, 11, 40));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the clock again every minute and stops when unmounted', () => {
    const { result, unmount } = renderHook(() => useNow());
    expect(result.current.getMinutes()).toBe(40);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.getMinutes()).toBe(41);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps the time it is given', () => {
    const given = new Date(2026, 0, 1, 9, 0);
    const { result } = renderHook(() => useNow(given));
    act(() => {
      vi.advanceTimersByTime(120_000);
    });
    expect(result.current).toBe(given);
    expect(vi.getTimerCount()).toBe(0);
  });
});

import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ChatLoader,
  ChatMessage,
  ChatThread,
  MotionPreferenceProvider,
  StreamingText,
} from '../src/chat';

const TOKENS: Record<string, string> = {
  '--rx-motion-duration-fast': '120ms',
  '--rx-motion-duration-base': '180ms',
  '--rx-motion-duration-slow': '260ms',
  '--rx-motion-duration-count': '600ms',
  '--rx-motion-easing-standard': 'cubic-bezier(0.2, 0, 0, 1)',
  '--rx-motion-easing-enter': 'cubic-bezier(0, 0, 0, 1)',
  '--rx-motion-easing-exit': 'cubic-bezier(0.3, 0, 1, 1)',
  '--rx-motion-easing-settle': 'cubic-bezier(0.2, 0, 0, 1)',
  '--rx-motion-distance-shift': '4px',
  '--rx-motion-distance-tick': '2px',
  '--rx-motion-scale-from': '0.97',
  '--rx-motion-scale-press': '0.98',
  '--rx-motion-scale-dialog': '0.96',
  '--rx-motion-spring-press-stiffness': '600',
  '--rx-motion-spring-press-damping': '40',
  '--rx-motion-spring-press-mass': '1',
  '--rx-motion-spring-overlay-stiffness': '400',
  '--rx-motion-spring-overlay-damping': '40',
  '--rx-motion-spring-overlay-mass': '1',
};

/** A browser that can animate, with the theme's motion tokens and a hand-driven frame clock. */
function browser({ reduce = false } = {}) {
  let frames: FrameRequestCallback[] = [];
  let now = 0;
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion: reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  const animate = vi.fn(() => ({ onfinish: null, cancel: vi.fn() }));
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate });
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    () => ({ getPropertyValue: (name: string) => TOKENS[name] ?? '' }) as CSSStyleDeclaration,
  );
  return {
    animate,
    step(ms: number) {
      act(() => {
        now += ms;
        const due = frames;
        frames = [];
        for (const frame of due) frame(now);
      });
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(Element.prototype, 'animate');
});

const REPLY = 'Three invoices from Northwind are overdue, the oldest by forty two days.';

describe('StreamingText', () => {
  it('reveals a burst of text evenly, on whole words, and catches up within the slow duration', () => {
    const clock = browser();
    const { container, rerender } = render(<StreamingText text="" streaming />);
    rerender(<StreamingText text={REPLY} streaming />);
    const shown = () => container.querySelector('p')?.textContent ?? '';
    clock.step(16);
    clock.step(16);
    const early = shown();
    expect(early.length).toBeGreaterThan(0);
    expect(early.length).toBeLessThan(REPLY.length);
    // It stops at the end of a word, never inside one.
    expect(REPLY[early.length] === undefined || /\s/.test(REPLY[early.length] ?? '')).toBe(true);
    for (let i = 0; i < 30; i += 1) clock.step(16);
    expect(shown()).toBe(REPLY);
  });

  it('shows every chunk at once under reduced motion', () => {
    browser({ reduce: true });
    const { container, rerender } = render(<StreamingText text="" streaming />);
    rerender(<StreamingText text={REPLY} streaming />);
    expect(container.querySelector('p')).toHaveTextContent(REPLY);
  });

  it('shows a text that does not continue the last one at once', () => {
    const clock = browser();
    const { container, rerender } = render(<StreamingText text="First reply in full" />);
    rerender(<StreamingText text="A different reply" />);
    clock.step(16);
    expect(container.querySelector('p')).toHaveTextContent('A different reply');
  });
});

describe('ChatMessage and ChatLoader', () => {
  it('keeps the messages a thread opens with still and lets new ones enter', () => {
    const { animate } = browser();
    const { rerender } = render(
      <ChatThread>
        <ChatMessage from="user">History</ChatMessage>
      </ChatThread>,
    );
    expect(animate).not.toHaveBeenCalled();
    rerender(
      <ChatThread>
        <ChatMessage from="user">History</ChatMessage>
        <ChatMessage from="assistant">New reply</ChatMessage>
      </ChatThread>,
    );
    expect(animate).toHaveBeenCalledOnce();
    expect(screen.getAllByRole('article')[1]).toHaveAttribute('data-motion');
  });

  it('fades the typing dots up, and is plain when motion is off', () => {
    const { animate } = browser();
    render(<ChatLoader />);
    expect(animate).toHaveBeenCalledOnce();
    animate.mockClear();
    render(
      <MotionPreferenceProvider value="off">
        <ChatLoader />
        <ChatMessage from="assistant">Plain</ChatMessage>
      </MotionPreferenceProvider>,
    );
    expect(animate).not.toHaveBeenCalled();
  });
});

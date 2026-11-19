import { act, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Money } from '../src/index';

interface Built {
  themes: Record<string, Record<string, Record<string, string>>>;
}

/** The real motion tokens of every theme and mode, as the stylesheet carries them. */
const built = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../tokens/dist/tokens.json'), 'utf8'),
) as Built;
const themeModes = Object.entries(built.themes).flatMap(([theme, modes]) =>
  Object.entries(modes).map(([mode, tokens]) => ({ key: `${theme}/${mode}`, tokens })),
);

/** A CSS cubic-bezier easing, solved for x by bisection: y at a given time fraction. */
function cubicBezier(css: string): (t: number) => number {
  const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] =
    /cubic-bezier\(([^)]*)\)/.exec(css)?.[1]?.split(',').map(Number) ?? [];
  const at = (a: number, b: number, s: number) =>
    3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3;
  return (t) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i += 1) {
      const mid = (lo + hi) / 2;
      if (at(x1, x2, mid) < t) lo = mid;
      else hi = mid;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}

/**
 * A stand-in for the browser's clock: Web Animations timing with the real easing applied, and a
 * frame queue the test steps through by hand.
 */
function fakeBrowser(tokens: Record<string, string>) {
  let now = 0;
  let frames: FrameRequestCallback[] = [];

  class FakeEffect {
    constructor(
      _target: null,
      _keyframes: null,
      readonly timing: { duration: number; delay: number; easing: string },
    ) {}
    getComputedTiming() {
      const { duration, delay, easing } = this.timing;
      const linear = Math.min(Math.max((now - delay) / duration, 0), 1);
      return { progress: cubicBezier(easing)(linear) };
    }
  }
  class FakeAnimation {
    constructor(readonly effect: FakeEffect) {}
    get playState() {
      const { duration, delay } = this.effect.timing;
      return now >= delay + duration ? 'finished' : 'running';
    }
    play() {
      now = 0;
    }
    cancel() {
      now = Infinity;
    }
  }

  vi.stubGlobal('KeyframeEffect', FakeEffect);
  vi.stubGlobal('Animation', FakeAnimation);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: vi.fn() });
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    () => ({ getPropertyValue: (name: string) => tokens[name] ?? '' }) as CSSStyleDeclaration,
  );

  return {
    /** Moves the clock on and draws the frames that were asked for. */
    step(ms: number) {
      now += ms;
      const due = frames;
      frames = [];
      for (const frame of due) frame(now);
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(Element.prototype, 'animate');
});

/** The figure the counting face shows, or the final amount once it is done. */
function shown(container: HTMLElement): number {
  const face = container.querySelector('[data-slot="money-motion"] > span[aria-hidden]');
  const host = container.querySelector<HTMLElement>('[data-slot="money-motion"]');
  const text =
    host?.dataset.counting === undefined
      ? (container.querySelector('[data-slot="money"]')?.textContent ?? '')
      : (face?.textContent ?? '');
  const sign = text.includes('-') || text.includes('−') ? -1 : 1;
  return sign * Number(text.replace(/[^\d.]/g, ''));
}

describe('Money count-up', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each(themeModes)(
    '$key never overshoots: every frame lies between the two amounts',
    ({ tokens }) => {
      for (const [from, to] of [
        [1082.32, 1211.72],
        [1211.72, 82.32],
        [-40, 125.5],
      ] as const) {
        const clock = fakeBrowser(tokens);
        const { container, rerender, unmount } = render(
          <Money amount={from} currency="EUR" locale="en-IE" />,
        );
        act(() => {
          rerender(<Money amount={to} currency="EUR" locale="en-IE" />);
        });
        const frames: number[] = [shown(container)];
        // Through the delay and the count, at about 60 frames a second, and a little past the end.
        for (let i = 0; i < 80; i += 1) {
          act(() => {
            clock.step(16);
          });
          frames.push(shown(container));
        }
        const [low, high] = from < to ? [from, to] : [to, from];
        for (const value of frames) {
          expect(value).toBeGreaterThanOrEqual(low - 0.005);
          expect(value).toBeLessThanOrEqual(high + 0.005);
        }
        // Monotonic: each frame is as far along as the one before, never back.
        const direction = Math.sign(to - from);
        frames.slice(1).forEach((value, index) => {
          expect((value - (frames[index] ?? from)) * direction).toBeGreaterThanOrEqual(-0.005);
        });
        expect(frames.at(-1)).toBeCloseTo(to, 2);
        unmount();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
      }
    },
  );
});

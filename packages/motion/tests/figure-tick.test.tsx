import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MotionPreferenceProvider } from '../src/lib/mode';
import type { MotionTokens } from '../src/lib/tokens';
import { NumberField } from '../src/number-field/number-field';

const TOKENS: MotionTokens = {
  duration: { fast: 0.12, base: 0.18, slow: 0.28, count: 0.64 },
  easing: {
    standard: [0.2, 0, 0, 1],
    enter: [0, 0, 0.2, 1],
    exit: [0.4, 0, 1, 1],
    settle: [0.16, 1, 0.3, 1],
  },
  distance: { shift: '0.25rem', tick: '0.125rem' },
  scale: { from: 0.98, press: 0.97, dialog: 0.96 },
  spring: {
    press: { stiffness: 720, damping: 52, mass: 1 },
    overlay: { stiffness: 420, damping: 41, mass: 1 },
  },
};

// jsdom has no token stylesheet; hand the tick the values a theme would.
vi.mock('../src/lib/tokens', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  readMotionTokens: () => TOKENS,
}));

const animate = vi.fn(() => ({
  finished: Promise.resolve(),
  cancel: vi.fn(),
  stop: vi.fn(),
  onfinish: null,
}));

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(Element.prototype, 'animate');
  animate.mockClear();
});

function Seats({ preference = 'user' }: { preference?: 'user' | 'off' }) {
  const [seats, setSeats] = useState<number | null>(12);
  return (
    <MotionPreferenceProvider value={preference}>
      <NumberField aria-label="Seats" value={seats} onValueChange={setSeats} />
    </MotionPreferenceProvider>
  );
}

/** Keyframes of the transforms the tick ran on the input. */
const ticks = () =>
  animate.mock.calls
    .map((call) => (call as unknown[])[0] as Keyframe[] | PropertyIndexedKeyframes)
    .map((frames) => JSON.stringify(frames));

describe('motioned NumberField', () => {
  it('ticks the figure in the direction of a stepped change', async () => {
    render(<Seats />);
    await userEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(screen.getByRole('textbox', { name: 'Seats' })).toHaveValue('13');
    expect(ticks().at(-1)).toContain('translateY(0.125rem)');
    await userEvent.click(screen.getByRole('button', { name: 'Decrease' }));
    expect(ticks().at(-1)).toContain('translateY(-0.125rem)');
  });

  it('never moves a typed figure', async () => {
    render(<Seats />);
    const input = screen.getByRole('textbox', { name: 'Seats' });
    await userEvent.clear(input);
    await userEvent.type(input, '40');
    await userEvent.tab();
    expect(input).toHaveValue('40');
    expect(animate).not.toHaveBeenCalled();
  });

  it('is the plain field when the app turns motion off', async () => {
    const { container } = render(<Seats preference="off" />);
    expect(container.querySelector('[data-motion]')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(animate).not.toHaveBeenCalled();
  });
});

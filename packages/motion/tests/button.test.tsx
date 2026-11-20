import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Button } from '../src/index';

/** A browser that can animate and has no reduced motion set, so the motion button renders. */
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
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: vi.fn() });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('motion Button loading', () => {
  it('keeps the label in place and readable while the spinner arrives', () => {
    render(<Button loading>Sign in</Button>);
    const button = screen.getByRole('button', { name: 'Sign in' });
    expect(button).toHaveAttribute('data-motion');
    expect(button).toHaveAttribute('aria-busy', 'true');
    const label = screen.getByText('Sign in');
    // The label is a plain text node of the button: nothing moves or fades it.
    expect(label).toBe(button);
    expect(button.querySelector('[data-part="indicator"]')).not.toBeNull();
  });

  it('crosses the leading icon with the spinner inside one slot, so the width holds', () => {
    render(
      <Button loading>
        <svg data-testid="icon" aria-hidden />
        Send reminder
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Send reminder' });
    const slot = button.querySelector('[data-part="icon-slot"]');
    expect(slot?.querySelector('[data-part="icon"]')?.contains(screen.getByTestId('icon'))).toBe(
      true,
    );
    const indicator = slot?.querySelector('[data-part="indicator"]');
    expect(indicator?.className).toContain('absolute');
    expect(indicator?.className).toContain('ease-enter');
  });

  it('draws no spinner while idle', () => {
    render(
      <Button>
        <svg aria-hidden />
        Send reminder
      </Button>,
    );
    expect(screen.getByRole('button').querySelector('[data-part="indicator"]')).toBeNull();
  });
});

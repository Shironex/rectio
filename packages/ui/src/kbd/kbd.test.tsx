import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Kbd, KbdCombo } from './kbd';

describe('Kbd', () => {
  it('shows a symbol and reads its name', () => {
    render(<Kbd>⌘</Kbd>);
    expect(screen.getByText('⌘')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Command')).toHaveClass('sr-only');
  });

  it('marks a combination as nested kbd elements', () => {
    const { container } = render(<KbdCombo keys={['⇧', '⌘', 'P']} separator="+" />);
    const outer = container.firstElementChild;
    expect(outer?.tagName).toBe('KBD');
    expect(outer?.querySelectorAll('kbd')).toHaveLength(3);
    expect(outer).toHaveTextContent(/Shift.*Command.*P/);
  });
});

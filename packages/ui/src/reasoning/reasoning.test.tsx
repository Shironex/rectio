import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Reasoning } from './reasoning';

describe('Reasoning', () => {
  it('opens while thinking and folds to how long it took when done', () => {
    const { rerender } = render(<Reasoning status="thinking">Checking the ledger</Reasoning>);
    const trigger = screen.getByRole('button', { name: 'Thinking' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    rerender(
      <Reasoning status="done" duration={12.4}>
        Checking the ledger
      </Reasoning>,
    );
    expect(screen.getByRole('button', { name: 'Thought for 12 seconds' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it("keeps the reader's choice over the status", async () => {
    const { rerender } = render(<Reasoning status="thinking">Steps</Reasoning>);
    await userEvent.click(screen.getByRole('button', { name: 'Thinking' }));
    expect(screen.getByRole('button', { name: 'Thinking' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    rerender(<Reasoning status="done">Steps</Reasoning>);
    await userEvent.click(screen.getByRole('button', { name: 'Reasoning' }));
    rerender(<Reasoning status="done">Steps more</Reasoning>);
    expect(screen.getByRole('button', { name: 'Reasoning' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});

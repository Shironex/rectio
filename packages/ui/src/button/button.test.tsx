import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('is a native button named by its label, and presses with Enter and Space', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('keeps focus and its name while loading, but ignores presses', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('leaves the tab order when disabled', async () => {
    render(
      <>
        <Button disabled>Delete</Button>
        <Button>Next</Button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('exposes variant and size for styling hooks', () => {
    render(
      <Button variant="danger" size="sm">
        Remove
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Remove' });
    expect(button).toHaveAttribute('data-variant', 'danger');
    expect(button).toHaveAttribute('data-size', 'sm');
  });
});

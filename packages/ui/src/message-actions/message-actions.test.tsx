import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  MessageActions,
  MessageCopyAction,
  MessageEditAction,
  MessageFeedback,
  MessageRegenerateAction,
} from './message-actions';

describe('MessageActions', () => {
  it('is one tab stop, moved through with the arrow keys, Home and End', async () => {
    render(
      <MessageActions>
        <MessageCopyAction value="text" />
        <MessageRegenerateAction onClick={vi.fn()} />
        <MessageEditAction onClick={vi.fn()} />
      </MessageActions>,
    );
    expect(screen.getByRole('toolbar', { name: 'Message actions' })).toBeInTheDocument();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Regenerate' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus();
    // Tab leaves the toolbar and Shift Tab comes back to the button used last.
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus();
  });

  it('copies the text and says Copied', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const onCopied = vi.fn();
    render(<MessageCopyAction value={() => 'Three invoices'} onCopied={onCopied} />);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('Three invoices');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    });
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    expect(onCopied).toHaveBeenCalledOnce();
  });

  it('rates with pressed thumbs, and a second press clears the rating', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<MessageFeedback value={null} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Good response' }));
    expect(onValueChange).toHaveBeenLastCalledWith('good');
    rerender(<MessageFeedback value="good" onValueChange={onValueChange} />);
    expect(screen.getByRole('button', { name: 'Good response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Good response' }));
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });
});

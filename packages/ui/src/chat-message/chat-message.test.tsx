import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChatMessage, ChatMessageEditor, StreamingText } from './chat-message';

describe('ChatMessage', () => {
  it('is an article named by its author', () => {
    render(
      <ChatMessage
        from="assistant"
        author="Ledger assistant"
        timestamp={new Date(2026, 2, 3, 9, 41)}
        locale="en-GB"
      >
        Three invoices are overdue.
      </ChatMessage>,
    );
    const article = screen.getByRole('article', { name: 'Ledger assistant' });
    expect(article).toHaveAttribute('data-from', 'assistant');
    expect(article.querySelector('time')).toHaveTextContent(/9:41/);
  });

  it('names the user\'s own messages "You" without showing the name', () => {
    render(<ChatMessage from="user">Which invoices are overdue?</ChatMessage>);
    expect(screen.getByRole('article', { name: 'You' })).toBeInTheDocument();
    expect(screen.getByText('You')).toHaveClass('sr-only');
  });

  it('says it is sending, stopped, or failed with the reason and Retry', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <ChatMessage from="user" status="sending">
        Hello
      </ChatMessage>,
    );
    expect(screen.getByText('Sending')).toBeInTheDocument();
    rerender(
      <ChatMessage from="assistant" status="stopped">
        Partial
      </ChatMessage>,
    );
    expect(screen.getByText('Stopped')).toBeInTheDocument();
    rerender(
      <ChatMessage from="user" status="error" error="You are offline." onRetry={onRetry}>
        Hello
      </ChatMessage>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('You are offline.');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('marks a streaming reply busy', () => {
    render(
      <ChatMessage from="assistant" status="streaming">
        <StreamingText text="Working on" streaming />
      </ChatMessage>,
    );
    expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows a system note centred, without an avatar', () => {
    render(<ChatMessage from="system">Model changed to the fast one</ChatMessage>);
    expect(screen.getByRole('article')).toHaveTextContent('Model changed to the fast one');
    expect(screen.getByRole('article')).toHaveAttribute('data-from', 'system');
  });
});

describe('StreamingText', () => {
  it('passes the text to its render function and shows the caret only while streaming', () => {
    const { container, rerender } = render(
      <StreamingText text="**Hi**" streaming>
        {(text, streaming) => <span data-testid="out">{`${text}:${String(streaming)}`}</span>}
      </StreamingText>,
    );
    expect(screen.getByTestId('out')).toHaveTextContent('**Hi**:true');
    rerender(<StreamingText text="Plain" streaming />);
    expect(container.querySelector('p')?.className).toContain('after:animate-breathe');
    rerender(<StreamingText text="Plain" />);
    expect(container.querySelector('p')?.className).not.toContain('after:animate-breathe');
  });
});

describe('ChatMessageEditor', () => {
  it('takes focus, saves with Ctrl Enter and cancels with Escape', async () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<ChatMessageEditor defaultValue="Old words" onSave={onSave} onCancel={onCancel} />);
    const field = screen.getByRole('textbox', { name: 'Edit message' });
    expect(field).toHaveFocus();
    await userEvent.type(field, ' and new');
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    expect(onSave).toHaveBeenCalledWith('Old words and new');
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('cancels instead of saving unchanged or empty words', async () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<ChatMessageEditor defaultValue="Same" onSave={onSave} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save and send' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

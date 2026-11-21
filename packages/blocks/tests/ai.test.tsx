import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AiChatThread, type AiChatTurn } from '../src/ai';
import { AiChatThread as MotionAiChatThread } from '../src/ai/motion';

const QUESTION: AiChatTurn = { id: 'u1', role: 'user', content: 'Which invoices are overdue?' };
const CONVERSATION: AiChatTurn[] = [
  QUESTION,
  {
    id: 'a1',
    role: 'assistant',
    content: 'Three are overdue:\n\n```sql\nselect * from invoices\n```',
    reasoning: { text: 'Checking the ledger', status: 'done', duration: 4 },
    tools: [
      { id: 't1', name: 'search_invoices', title: 'Searched unpaid invoices', status: 'done' },
    ],
    sources: [{ id: 's1', title: 'AP policy', url: 'https://example.com/ap' }],
    feedback: null,
  },
];

describe('AiChatThread', () => {
  it('offers suggestions on an empty thread and sends the one chosen', async () => {
    const onSend = vi.fn();
    render(
      <AiChatThread
        conversation={[]}
        onSend={onSend}
        suggestions={[
          { id: 'q', label: 'Overdue invoices', prompt: 'Which invoices are overdue?' },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'What can I help with?' })).toBeInTheDocument();
    const chips = screen.getByRole('list', { name: 'Suggestions' });
    await userEvent.click(within(chips).getByRole('button', { name: /Overdue invoices/ }));
    expect(onSend).toHaveBeenCalledWith('Which invoices are overdue?', []);
  });

  it('draws a reply with reasoning, tools, a code block, sources and actions', async () => {
    const onRegenerate = vi.fn();
    const onFeedback = vi.fn();
    render(
      <AiChatThread
        conversation={CONVERSATION}
        onSend={vi.fn()}
        onRegenerate={onRegenerate}
        onFeedback={onFeedback}
      />,
    );
    const reply = screen.getByRole('article', { name: /Assistant/ });
    expect(
      within(reply).getByRole('button', { name: 'Thought for 4 seconds' }),
    ).toBeInTheDocument();
    expect(
      within(reply).getByRole('button', { name: /Searched unpaid invoices/ }),
    ).toBeInTheDocument();
    expect(reply.querySelector('pre')).toHaveTextContent('select * from invoices');
    expect(within(reply).getByRole('button', { name: '1 source' })).toBeInTheDocument();
    await userEvent.click(within(reply).getByRole('button', { name: 'Regenerate' }));
    expect(onRegenerate).toHaveBeenCalledWith(CONVERSATION[1]);
    await userEvent.click(within(reply).getByRole('button', { name: 'Good response' }));
    expect(onFeedback).toHaveBeenCalledWith(CONVERSATION[1], 'good');
  });

  it('shows typing dots while waiting, Stop while streaming, and no actions on a streaming reply', async () => {
    const onStop = vi.fn();
    const { rerender } = render(
      <AiChatThread conversation={[QUESTION]} status="submitting" onSend={vi.fn()} />,
    );
    expect(screen.getByText('Assistant is typing')).toBeInTheDocument();
    rerender(
      <AiChatThread
        conversation={[
          QUESTION,
          { id: 'a2', role: 'assistant', content: 'Three', status: 'streaming' },
        ]}
        status="streaming"
        onSend={vi.fn()}
        onStop={onStop}
        onRegenerate={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Regenerate' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it('turns [1](#source-1) in a reply into the chip of that source', () => {
    render(
      <AiChatThread
        conversation={[
          QUESTION,
          {
            id: 'a3',
            role: 'assistant',
            content: 'Three are overdue [1](#source-1) and one is still to come [9](#source-9).',
            sources: [{ id: 's1', title: 'AP policy', url: 'https://example.com/ap' }],
          },
        ]}
        onSend={vi.fn()}
      />,
    );
    expect(screen.getByRole('link', { name: 'Source 1: AP policy' })).toHaveAttribute(
      'href',
      'https://example.com/ap',
    );
    // A number whose source has not arrived is a chip without a link.
    expect(screen.queryByRole('link', { name: /9/ })).not.toBeInTheDocument();
    expect(screen.getByText(/^Source 9/)).toBeInTheDocument();
  });

  it('renders the same thread from the motion entry', () => {
    render(<MotionAiChatThread conversation={CONVERSATION} onSend={vi.fn()} />);
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});

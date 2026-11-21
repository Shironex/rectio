import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChatLoader } from './chat-loader';

describe('ChatLoader', () => {
  it('is a status that says the assistant is typing, with dots that breathe under reduced motion', () => {
    const { container } = render(<ChatLoader />);
    expect(screen.getByRole('status')).toHaveTextContent('Assistant is typing');
    const dots = container.querySelectorAll('.animate-dot');
    expect(dots).toHaveLength(3);
    for (const dot of dots) expect(dot).toHaveClass('motion-reduce:animate-breathe');
  });

  it('draws the skeleton of a reply with the lines asked for', () => {
    const { container } = render(
      <ChatLoader variant="skeleton" lines={4} label="Loading history" />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading history');
    expect(container.querySelectorAll('[data-width]')).toHaveLength(4);
  });
});

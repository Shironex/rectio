import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  ChatAnnouncer,
  ChatDaySeparator,
  ChatThread,
  chatDayLabel,
  isSameDay,
} from './chat-thread';

/** jsdom has no layout: give the scroller a size and a scroll position by hand. */
function layout(
  element: HTMLElement,
  { scrollHeight, clientHeight, scrollTop }: Record<string, number>,
) {
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: clientHeight });
  element.scrollTop = scrollTop ?? 0;
  element.scrollTo = (options?: ScrollToOptions | number) => {
    if (typeof options === 'object') element.scrollTop = options.top ?? 0;
  };
}

describe('ChatThread', () => {
  it('is a focusable log with live announcements off', () => {
    render(
      <ChatThread label="Ask the ledger">
        <p>Hello</p>
      </ChatThread>,
    );
    const log = screen.getByRole('log', { name: 'Ask the ledger' });
    expect(log).toHaveAttribute('aria-live', 'off');
    expect(log).toHaveAttribute('tabindex', '0');
  });

  it('offers Jump to latest once the reader scrolls up, and jumps back with focus on the log', async () => {
    render(
      <ChatThread footer={<div>composer</div>}>
        <p>Hello</p>
      </ChatThread>,
    );
    const log = screen.getByRole('log');
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).not.toBeInTheDocument();
    layout(log, { scrollHeight: 2000, clientHeight: 500, scrollTop: 400 });
    fireEvent.scroll(log);
    const jump = screen.getByRole('button', { name: 'Jump to latest' });
    await userEvent.click(jump);
    expect(log.scrollTop).toBe(2000);
    expect(log).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).not.toBeInTheDocument();
    expect(screen.getByText('composer')).toBeInTheDocument();
  });
});

describe('days', () => {
  const now = new Date(2026, 10, 21, 15, 0);

  it('labels today, yesterday, this week and older days', () => {
    expect(chatDayLabel(new Date(2026, 10, 21, 8), { now, locale: 'en' })).toBe('Today');
    expect(chatDayLabel(new Date(2026, 10, 20, 23), { now, locale: 'en' })).toBe('Yesterday');
    expect(chatDayLabel(new Date(2026, 10, 18), { now, locale: 'en' })).toBe('Wednesday');
    expect(chatDayLabel(new Date(2026, 9, 2), { now, locale: 'en' })).toBe('October 2');
    expect(chatDayLabel(new Date(2025, 9, 2), { now, locale: 'en' })).toBe('October 2, 2025');
  });

  it('compares calendar days and draws a named separator', () => {
    expect(isSameDay(new Date(2026, 1, 1, 0, 5), new Date(2026, 1, 1, 23, 55))).toBe(true);
    render(<ChatDaySeparator date={new Date(2026, 10, 20)} now={now} locale="en" />);
    expect(screen.getByRole('separator', { name: 'Yesterday' })).toBeInTheDocument();
  });
});

describe('ChatAnnouncer', () => {
  it('says once that a reply started and once the finished reply, never each chunk', () => {
    const { rerender } = render(
      <ChatAnnouncer id="r1" text="" status="streaming" author="Ledger" />,
    );
    const region = document.querySelector('[data-slot="chat-announcer"]');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('Ledger is writing a reply.');
    rerender(
      <ChatAnnouncer id="r1" text="Three **invoices**" status="streaming" author="Ledger" />,
    );
    expect(region).toHaveTextContent('Ledger is writing a reply.');
    act(() => {
      rerender(
        <ChatAnnouncer id="r1" text="Three **invoices** are due." status="done" author="Ledger" />,
      );
    });
    expect(region).toHaveTextContent('Ledger said: Three invoices are due.');
  });

  it('stays quiet for replies that were already complete', () => {
    render(<ChatAnnouncer id="old" text="From history" status="done" />);
    expect(document.querySelector('[data-slot="chat-announcer"]')).toHaveTextContent('');
  });
});

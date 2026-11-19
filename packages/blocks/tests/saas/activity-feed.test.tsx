import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ActivityFeed,
  activityFilterCounts,
  activityMatches,
  groupActivityByDay,
  type ActivityEvent,
} from '../../src/index';

const NOW = new Date(2026, 2, 19, 14, 20);
const EVENTS: ActivityEvent[] = [
  {
    id: 'old',
    at: new Date(2026, 2, 16, 9),
    actor: { name: 'Kenji Arakawa' },
    kind: 'security',
    verb: 'turned on two-factor sign in',
  },
  {
    id: 'new',
    at: new Date(2026, 2, 19, 14, 15),
    actor: { name: 'Ines Duarte' },
    kind: 'comment',
    verb: 'commented on',
    target: 'Q1 board review',
    detail: 'Can we refresh the runway slide?',
  },
  {
    id: 'mid',
    at: new Date(2026, 2, 18, 11),
    actor: { name: 'Tomasz Wierzbicki' },
    kind: 'update',
    verb: 'moved',
    target: 'Renewals',
  },
];

describe('activity logic', () => {
  it('groups events by day, newest first', () => {
    const days = groupActivityByDay(EVENTS, NOW, 'en-GB');
    expect(days.map((day) => day.label)).toEqual(['Today', 'Yesterday', 'Monday 16 March']);
    expect(days.map((day) => day.key)).toEqual(['2026-03-19', '2026-03-18', '2026-03-16']);
  });

  it('filters by kind and counts each filter', () => {
    const [, comment] = EVENTS as [ActivityEvent, ActivityEvent, ActivityEvent];
    expect(activityMatches(comment, 'comments')).toBe(true);
    expect(activityMatches(comment, 'changes')).toBe(false);
    expect(activityFilterCounts(EVENTS)).toEqual({
      all: 3,
      comments: 1,
      changes: 1,
      people: 0,
      account: 1,
    });
  });
});

describe('ActivityFeed', () => {
  it('reads as who did what, with the moment in words and the exact time', () => {
    render(<ActivityFeed events={EVENTS} now={NOW} locale="en-GB" />);
    const today = screen.getByRole('region', { name: 'Today' });
    expect(within(today).getByText('Q1 board review')).toBeInTheDocument();
    const time = within(today).getByText('5 minutes ago').closest('time');
    expect(time).toHaveAttribute('dateTime', EVENTS[1]?.at.toISOString());
    // An earlier day is already named by its heading, so its events show the clock time.
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('filters to one kind and leaves out empty filters', async () => {
    render(<ActivityFeed events={EVENTS} filterable now={NOW} locale="en-GB" />);
    expect(screen.queryByRole('button', { name: /People/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Comments/ }));
    expect(screen.queryByText('Renewals')).not.toBeInTheDocument();
    expect(screen.getByText('Q1 board review')).toBeInTheDocument();
  });

  it('loads older activity', async () => {
    const onLoadMore = vi.fn();
    render(<ActivityFeed events={EVENTS} hasMore onLoadMore={onLoadMore} now={NOW} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show older activity' }));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it('says what will appear when there is nothing, and offers the next step', async () => {
    const onInvite = vi.fn();
    render(<ActivityFeed events={[]} now={NOW} onInvite={onInvite} />);
    expect(screen.getByRole('status')).toHaveTextContent('No activity yet');
    await userEvent.click(screen.getByRole('button', { name: 'Invite your team' }));
    expect(onInvite).toHaveBeenCalled();
  });
});

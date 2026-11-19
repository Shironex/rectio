import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  NotificationPreferences,
  groupNotificationEvents,
  notificationColumnState,
  notificationCount,
  notificationOn,
  setNotification,
  setNotificationColumn,
  type NotificationEvent,
  type NotificationMatrix,
} from '../../src/index';

const CHANNELS = [
  { id: 'email', label: 'Email' },
  { id: 'push', label: 'Push' },
];
const EVENTS: NotificationEvent[] = [
  { id: 'mention', group: 'Work', label: 'Mentions' },
  { id: 'digest', group: 'Work', label: 'Digest' },
  { id: 'sign-in', group: 'Security', label: 'New sign in', required: ['email'] },
];
const VALUE: NotificationMatrix = { mention: ['email', 'push'], digest: ['email'] };
const [MENTION, DIGEST, SIGN_IN] = EVENTS as [
  NotificationEvent,
  NotificationEvent,
  NotificationEvent,
];

describe('notification logic', () => {
  it('keeps required channels on', () => {
    expect(notificationOn({}, SIGN_IN, 'email')).toBe(true);
    expect(setNotification(VALUE, SIGN_IN, 'email', false)).toBe(VALUE);
    expect(setNotification(VALUE, DIGEST, 'push', true).digest).toEqual(['email', 'push']);
    expect(setNotification(VALUE, MENTION, 'push', false).mention).toEqual(['email']);
  });

  it('reads and sets whole columns', () => {
    expect(notificationColumnState(VALUE, EVENTS, 'email')).toBe('all');
    expect(notificationColumnState(VALUE, EVENTS, 'push')).toBe('some');
    const off = setNotificationColumn(VALUE, EVENTS, 'email', false);
    expect(notificationColumnState(off, EVENTS, 'email')).toBe('some');
    expect(notificationOn(off, SIGN_IN, 'email')).toBe(true);
    expect(notificationCount(VALUE, EVENTS, CHANNELS)).toBe(4);
    expect(groupNotificationEvents(EVENTS).map((g) => [g.name, g.events.length])).toEqual([
      ['Work', 2],
      ['Security', 1],
    ]);
  });
});

describe('NotificationPreferences', () => {
  it('toggles one pair and reports the whole matrix', async () => {
    const onChange = vi.fn();
    render(
      <NotificationPreferences
        channels={CHANNELS}
        events={EVENTS}
        value={VALUE}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Digest by Push' }));
    expect(onChange).toHaveBeenCalledWith({ ...VALUE, digest: ['email', 'push'] });
  });

  it('turns a column on from its header, shown as mixed while partial', async () => {
    const onChange = vi.fn();
    render(
      <NotificationPreferences
        channels={CHANNELS}
        events={EVENTS}
        value={VALUE}
        onChange={onChange}
      />,
    );
    const column = screen.getByRole('checkbox', { name: 'All events by Push' });
    expect(column).toHaveAttribute('aria-checked', 'mixed');
    await userEvent.click(column);
    expect(onChange).toHaveBeenCalledWith({
      mention: ['email', 'push'],
      digest: ['email', 'push'],
      'sign-in': ['push'],
    });
  });

  it('offers the recommended set while nothing is chosen', async () => {
    const onUseRecommended = vi.fn();
    const { rerender } = render(
      <NotificationPreferences
        channels={CHANNELS}
        events={EVENTS}
        value={{}}
        onChange={vi.fn()}
        onUseRecommended={onUseRecommended}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Use recommended' }));
    expect(onUseRecommended).toHaveBeenCalled();
    rerender(
      <NotificationPreferences
        channels={CHANNELS}
        events={EVENTS}
        value={VALUE}
        onChange={vi.fn()}
        onUseRecommended={onUseRecommended}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Use recommended' })).not.toBeInTheDocument();
  });

  it('turns everything on from one control on a narrow block', async () => {
    const onChange = vi.fn();
    render(
      <NotificationPreferences
        channels={CHANNELS}
        events={EVENTS}
        value={VALUE}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Turn all on' }));
    const next = onChange.mock.calls[0]?.[0] as NotificationMatrix;
    expect(notificationCount(next, EVENTS, CHANNELS)).toBe(6);
  });

  it('locks required pairs and says why', () => {
    render(
      <NotificationPreferences
        channels={CHANNELS}
        events={EVENTS}
        value={VALUE}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('New sign in, Email, always on')).toBeInTheDocument();
    expect(
      screen.queryByRole('checkbox', { name: 'New sign in by Email' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('Email always on').length).toBeGreaterThan(0);
  });
});

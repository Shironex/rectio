import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  NotificationsCenter,
  markAllNotificationsRead,
  markNotificationRead,
  unreadBadgeText,
  unreadNotificationCount,
  visibleNotifications,
  type AppNotification,
} from '../../src/index';

const NOW = new Date(2026, 2, 19, 14, 20);
const LIST: AppNotification[] = [
  {
    id: 'read',
    title: 'Your invoice for March is ready',
    at: new Date(2026, 2, 15),
    read: true,
    kind: 'billing',
  },
  {
    id: 'mention',
    title: 'Ines Duarte mentioned you',
    at: new Date(2026, 2, 19, 14),
    read: false,
    kind: 'mention',
    actor: { name: 'Ines Duarte' },
  },
];

describe('notifications logic', () => {
  it('counts, orders and marks read', () => {
    expect(unreadNotificationCount(LIST)).toBe(1);
    expect(visibleNotifications(LIST, 'all').map((n) => n.id)).toEqual(['mention', 'read']);
    expect(visibleNotifications(LIST, 'unread').map((n) => n.id)).toEqual(['mention']);
    expect(unreadNotificationCount(markNotificationRead(LIST, 'mention'))).toBe(0);
    expect(unreadNotificationCount(markAllNotificationsRead(LIST))).toBe(0);
    expect(markNotificationRead(LIST, 'read')[0]).toBe(LIST[0]);
    expect(unreadBadgeText(4)).toBe('4');
    expect(unreadBadgeText(12)).toBe('9+');
  });
});

describe('NotificationsCenter', () => {
  it('names the bell with the unread count and opens the list', async () => {
    render(
      <NotificationsCenter
        notifications={LIST}
        now={NOW}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Notifications, 1 unread' }));
    const dialog = await screen.findByRole('dialog', { name: 'Notifications' });
    expect(within(dialog).getByText('Ines Duarte mentioned you')).toBeInTheDocument();
  });

  it('marks a notification read when it is opened', async () => {
    const onMarkRead = vi.fn();
    const onOpen = vi.fn();
    render(
      <NotificationsCenter
        inline
        notifications={LIST}
        now={NOW}
        onOpen={onOpen}
        onMarkRead={onMarkRead}
        onMarkAllRead={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Unread,\s*Ines Duarte mentioned you/ }),
    );
    expect(onMarkRead).toHaveBeenCalledWith('mention');
    expect(onOpen).toHaveBeenCalledWith(LIST[1]);
  });

  it('marks all read and shows unread only on request', async () => {
    const onMarkAllRead = vi.fn();
    render(
      <NotificationsCenter
        inline
        notifications={LIST}
        now={NOW}
        onMarkRead={vi.fn()}
        onMarkAllRead={onMarkAllRead}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Unread\s*1/ }));
    expect(screen.queryByText('Your invoice for March is ready')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(onMarkAllRead).toHaveBeenCalled();
  });

  it('says when there is nothing to read', () => {
    render(
      <NotificationsCenter
        inline
        notifications={[]}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
      />,
    );
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark all as read' })).not.toBeInTheDocument();
  });
});

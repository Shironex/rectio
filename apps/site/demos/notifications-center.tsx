'use client';

import {
  NotificationsCenter,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '@rectio/blocks';
import { useState } from 'react';

export const NOW = new Date(2026, 2, 19, 14, 20);
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Ines Duarte mentioned you in Q1 board review',
    body: 'Niamh, can you confirm the runway figure before we send the pack?',
    at: ago(6),
    read: false,
    kind: 'mention',
    actor: { name: 'Ines Duarte' },
  },
  {
    id: 'n2',
    title: 'New sign in from Firefox on Windows',
    body: 'Cork, Ireland. If this was not you, reset your password.',
    at: ago(180),
    read: false,
    kind: 'security',
  },
  {
    id: 'n3',
    title: 'Your invoice for March is ready',
    at: ago(5760),
    read: true,
    kind: 'billing',
  },
];

/** Read state lives in the app; the exported helpers update it. */
export default function NotificationsCenterDemo() {
  const [items, setItems] = useState(NOTIFICATIONS);
  return (
    <div className="flex w-full justify-end">
      <NotificationsCenter
        notifications={items}
        now={NOW}
        locale="en-GB"
        settings="#notification-settings"
        onMarkRead={(id) => {
          setItems(markNotificationRead(items, id));
        }}
        onMarkAllRead={() => {
          setItems(markAllNotificationsRead(items));
        }}
      />
    </div>
  );
}

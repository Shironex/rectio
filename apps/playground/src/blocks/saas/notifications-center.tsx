import {
  NotificationsCenter as PlainNotificationsCenter,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '@rectio/blocks';
import { NotificationsCenter as MotionNotificationsCenter } from '@rectio/blocks/motion';
import { useState } from 'react';

import { NOW, ago, type DemoProps } from './demo';

const NOTIFICATIONS: AppNotification[] = [
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
    title: 'Tomasz Wierzbicki assigned you Vendor contract renewals',
    at: ago(52),
    read: false,
    kind: 'assigned',
    actor: { name: 'Tomasz Wierzbicki' },
  },
  {
    id: 'n3',
    title: 'New sign in from Firefox on Windows',
    body: 'Warsaw, Poland. If this was not you, reset your password.',
    at: ago(60 * 3),
    read: false,
    kind: 'security',
  },
  {
    id: 'n4',
    title: 'Aiyana Brooks replied to your comment',
    body: 'Agreed, moving the close to the 4th.',
    at: ago(60 * 26),
    read: true,
    kind: 'comment',
    actor: { name: 'Aiyana Brooks' },
  },
  {
    id: 'n5',
    title: 'Your invoice for March is ready',
    at: ago(60 * 24 * 4),
    read: true,
    kind: 'billing',
  },
];

export function NotificationsCenterDemo({ motion, empty, locale }: DemoProps) {
  const NotificationsCenter = motion ? MotionNotificationsCenter : PlainNotificationsCenter;
  const [items, setItems] = useState(empty ? [] : NOTIFICATIONS);
  const common = {
    notifications: items,
    now: NOW,
    locale,
    settings: () => undefined,
    onMarkRead: (id: string) => {
      setItems(markNotificationRead(items, id));
    },
    onMarkAllRead: () => {
      setItems(markAllNotificationsRead(items));
    },
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end gap-2 rounded-panel border border-line bg-surface px-4 py-2">
        <span className="me-auto text-sm text-fg-muted">App header with the bell</span>
        <NotificationsCenter {...common} />
      </div>
      <NotificationsCenter {...common} inline className="max-w-md" />
    </div>
  );
}

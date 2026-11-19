'use client';

import { markAllNotificationsRead, markNotificationRead } from '@rectio/blocks';
import { NotificationsCenter } from '@rectio/blocks/motion';
import { useState } from 'react';

import { NOTIFICATIONS, NOW } from './notifications-center';

export default function NotificationsCenterMotionDemo() {
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

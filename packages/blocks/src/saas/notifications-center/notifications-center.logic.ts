export type AppNotificationKind =
  'mention' | 'comment' | 'assigned' | 'invite' | 'billing' | 'security' | 'system';

export interface AppNotification {
  id: string;
  /** The line itself: "Ines mentioned you in Q1 board review". */
  title: string;
  /** A short excerpt under the title. */
  body?: string;
  at: Date;
  read: boolean;
  kind: AppNotificationKind;
  /** The person behind it; system notices show their kind's icon instead. */
  actor?: { name: string; avatarUrl?: string };
}

export type NotificationsFilter = 'all' | 'unread';

export function unreadNotificationCount(notifications: readonly AppNotification[]): number {
  return notifications.filter((notification) => !notification.read).length;
}

/** Newest first, unread only when asked. */
export function visibleNotifications(
  notifications: readonly AppNotification[],
  filter: NotificationsFilter,
): AppNotification[] {
  return notifications
    .filter((notification) => filter === 'all' || !notification.read)
    .sort((a, b) => b.at.getTime() - a.at.getTime());
}

/** The list with one notification read: for an app keeping notifications in state. */
export function markNotificationRead(
  notifications: readonly AppNotification[],
  id: string,
): AppNotification[] {
  return notifications.map((notification) =>
    notification.id === id && !notification.read ? { ...notification, read: true } : notification,
  );
}

export function markAllNotificationsRead(
  notifications: readonly AppNotification[],
): AppNotification[] {
  return notifications.map((notification) =>
    notification.read ? notification : { ...notification, read: true },
  );
}

/** "9+" past nine, so the badge on the bell keeps its size. */
export function unreadBadgeText(count: number): string {
  return count > 9 ? '9+' : String(count);
}

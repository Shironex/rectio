export interface NotificationChannel {
  id: string;
  /** Short, it heads a column: "Email", "In app", "Push". */
  label: string;
}

export interface NotificationEvent {
  id: string;
  label: string;
  description?: string;
  /** Events with the same group sit under one heading, in the order groups first appear. */
  group: string;
  /** Channels that stay on for this event, such as security alerts by email. */
  required?: readonly string[];
}

/** For each event id, the ids of the channels it is sent on. */
export type NotificationMatrix = Readonly<Record<string, readonly string[]>>;

export function notificationLocked(event: NotificationEvent, channelId: string): boolean {
  return event.required?.includes(channelId) === true;
}

/** On when chosen, and always on where the event requires the channel. */
export function notificationOn(
  matrix: NotificationMatrix,
  event: NotificationEvent,
  channelId: string,
): boolean {
  return notificationLocked(event, channelId) || (matrix[event.id]?.includes(channelId) ?? false);
}

/** Turns one event on one channel on or off; a required channel never turns off. */
export function setNotification(
  matrix: NotificationMatrix,
  event: NotificationEvent,
  channelId: string,
  on: boolean,
): NotificationMatrix {
  if (!on && notificationLocked(event, channelId)) return matrix;
  const current = matrix[event.id] ?? [];
  const without = current.filter((id) => id !== channelId);
  return { ...matrix, [event.id]: on ? [...without, channelId] : without };
}

export type NotificationColumnState = 'all' | 'some' | 'none';

/** Whether every event, some or none is sent on a channel, for the column's own checkbox. */
export function notificationColumnState(
  matrix: NotificationMatrix,
  events: readonly NotificationEvent[],
  channelId: string,
): NotificationColumnState {
  const on = events.filter((event) => notificationOn(matrix, event, channelId)).length;
  if (on === 0) return 'none';
  return on === events.length ? 'all' : 'some';
}

/** Every event on or off for one channel; required ones stay on. */
export function setNotificationColumn(
  matrix: NotificationMatrix,
  events: readonly NotificationEvent[],
  channelId: string,
  on: boolean,
): NotificationMatrix {
  return events.reduce((next, event) => setNotification(next, event, channelId, on), matrix);
}

export interface NotificationGroup {
  name: string;
  events: NotificationEvent[];
}

export function groupNotificationEvents(events: readonly NotificationEvent[]): NotificationGroup[] {
  const groups: NotificationGroup[] = [];
  for (const event of events) {
    const group = groups.find((g) => g.name === event.group);
    if (group === undefined) groups.push({ name: event.group, events: [event] });
    else group.events.push(event);
  }
  return groups;
}

/** How many event and channel pairs are on, required ones included. */
export function notificationCount(
  matrix: NotificationMatrix,
  events: readonly NotificationEvent[],
  channels: readonly NotificationChannel[],
): number {
  return events.reduce(
    (sum, event) => sum + channels.filter((c) => notificationOn(matrix, event, c.id)).length,
    0,
  );
}

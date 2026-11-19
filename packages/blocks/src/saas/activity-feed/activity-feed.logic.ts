import { dayLabel, sameDay } from '../lib/saas';

/** What kind of thing happened; it picks the event's icon and its filter. */
export type ActivityKind =
  'comment' | 'create' | 'update' | 'delete' | 'member' | 'billing' | 'security';

export interface ActivityActor {
  name: string;
  avatarUrl?: string;
  /** The app itself, not a person: drawn as a small node on the rail instead of an avatar. */
  system?: boolean;
}

export interface ActivityEvent {
  id: string;
  at: Date;
  actor: ActivityActor;
  kind: ActivityKind;
  /** What the actor did, in the past tense: "commented on", "invited", "changed the plan to". */
  verb: string;
  /** What it was done to: "Q1 board review", "margot@fernhill.io". */
  target?: string;
  /** A quote or a detail under the line, such as the comment itself. */
  detail?: string;
}

export type ActivityFilter = 'all' | 'comments' | 'changes' | 'people' | 'account';

const FILTER_KINDS: Record<Exclude<ActivityFilter, 'all'>, readonly ActivityKind[]> = {
  comments: ['comment'],
  changes: ['create', 'update', 'delete'],
  people: ['member'],
  account: ['billing', 'security'],
};

export const ACTIVITY_FILTER_LABELS: Record<ActivityFilter, string> = {
  all: 'All',
  comments: 'Comments',
  changes: 'Changes',
  people: 'People',
  account: 'Account',
};

export function activityMatches(event: ActivityEvent, filter: ActivityFilter): boolean {
  return filter === 'all' || FILTER_KINDS[filter].includes(event.kind);
}

/** Each filter's count, so the filter row can leave out the ones with nothing in them. */
export function activityFilterCounts(
  events: readonly ActivityEvent[],
): Record<ActivityFilter, number> {
  const counts: Record<ActivityFilter, number> = {
    all: events.length,
    comments: 0,
    changes: 0,
    people: 0,
    account: 0,
  };
  for (const event of events) {
    for (const filter of ['comments', 'changes', 'people', 'account'] as const) {
      if (activityMatches(event, filter)) counts[filter] += 1;
    }
  }
  return counts;
}

export interface ActivityDay {
  /** The day's date as yyyy-mm-dd, stable for keys. */
  key: string;
  label: string;
  events: ActivityEvent[];
}

const dayKey = (date: Date) =>
  `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Events newest first, grouped under Today, Yesterday or their date. */
export function groupActivityByDay(
  events: readonly ActivityEvent[],
  today: Date,
  locale: string,
): ActivityDay[] {
  const sorted = [...events].sort((a, b) => b.at.getTime() - a.at.getTime());
  const days: ActivityDay[] = [];
  for (const event of sorted) {
    const last = days.at(-1);
    const first = last?.events[0];
    if (last !== undefined && first !== undefined && sameDay(first.at, event.at)) {
      last.events.push(event);
    } else {
      days.push({
        key: dayKey(event.at),
        label: dayLabel(event.at, today, locale),
        events: [event],
      });
    }
  }
  return days;
}

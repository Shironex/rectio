'use client';

import { ActivityFeed, type ActivityEvent } from '@rectio/blocks';

export const NOW = new Date(2026, 2, 19, 14, 20);
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

export const EVENTS: ActivityEvent[] = [
  {
    id: 'e1',
    at: ago(4),
    actor: { name: 'Ines Duarte' },
    kind: 'comment',
    verb: 'commented on',
    target: 'Q1 board review',
    detail: 'Cash runway slide still shows February. Can we refresh it before Thursday?',
  },
  {
    id: 'e2',
    at: ago(47),
    actor: { name: 'Tomasz Wierzbicki' },
    kind: 'update',
    verb: 'moved',
    target: 'Vendor contract renewals',
    detail: 'From In review to Approved',
  },
  {
    id: 'e3',
    at: ago(1200),
    actor: { name: 'Niamh Walsh' },
    kind: 'member',
    verb: 'invited',
    target: 'margot.leclerc@fernhill.io',
  },
  {
    id: 'e4',
    at: ago(4500),
    actor: { name: 'Kenji Arakawa' },
    kind: 'security',
    verb: 'turned on two-factor sign in',
  },
];

export default function ActivityFeedDemo() {
  return (
    <div className="w-full">
      <ActivityFeed events={EVENTS} filterable now={NOW} locale="en-GB" />
    </div>
  );
}

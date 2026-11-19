import { ActivityFeed as PlainActivityFeed, type ActivityEvent } from '@rectio/blocks';
import { ActivityFeed as MotionActivityFeed } from '@rectio/blocks/motion';

import { NOW, ago, type DemoProps } from './demo';

const EVENTS: ActivityEvent[] = [
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
    at: ago(130),
    actor: { name: 'Niamh Walsh' },
    kind: 'member',
    verb: 'invited',
    target: 'margot.leclerc@fernhill.io',
  },
  {
    id: 'e4',
    at: ago(60 * 20),
    actor: { name: 'Aiyana Brooks' },
    kind: 'create',
    verb: 'created the project',
    target: 'April close',
  },
  {
    id: 'e5',
    at: ago(60 * 23),
    actor: { name: 'Niamh Walsh' },
    kind: 'billing',
    verb: 'changed the plan to',
    target: 'Growth, yearly',
  },
  {
    id: 'e6',
    at: ago(60 * 24 * 3 + 200),
    actor: { name: 'Kenji Arakawa' },
    kind: 'security',
    verb: 'turned on two-factor sign in',
  },
  {
    id: 'e7',
    at: ago(60 * 24 * 3 + 410),
    actor: { name: 'Ines Duarte' },
    kind: 'delete',
    verb: 'deleted the draft',
    target: 'Old travel policy',
  },
];

export function ActivityFeedDemo({ motion, empty, locale }: DemoProps) {
  const ActivityFeed = motion ? MotionActivityFeed : PlainActivityFeed;
  return (
    <ActivityFeed
      events={empty ? [] : EVENTS}
      filterable
      hasMore
      onLoadMore={() => undefined}
      now={NOW}
      locale={locale}
    />
  );
}

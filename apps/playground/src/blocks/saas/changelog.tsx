import { Changelog as PlainChangelog, type ChangelogRelease } from '@rectio/blocks';
import { Changelog as MotionChangelog } from '@rectio/blocks/motion';
import { useState } from 'react';

import { NOW, type DemoProps } from './demo';

const RELEASES: ChangelogRelease[] = [
  {
    id: 'r1',
    version: '2.14',
    date: new Date(2026, 2, 17),
    title: 'Approvals on the go',
    summary:
      'Approvers can now decide expenses from the notification itself, with the receipt attached.',
    changes: [
      { kind: 'new', text: 'Approve or reject an expense straight from its notification.' },
      { kind: 'improved', text: 'Receipts open at full size and keep their place when you zoom.' },
      { kind: 'fixed', text: 'Bulk approvals no longer skip the last selected row.' },
    ],
  },
  {
    id: 'r2',
    version: '2.13',
    date: new Date(2026, 2, 6),
    title: 'Faster bank matching',
    changes: [
      { kind: 'improved', text: 'Bank transactions match invoices twice as often without a rule.' },
      { kind: 'new', text: 'Split one transaction across several invoices.' },
      { kind: 'fixed', text: 'Polish currency amounts show the correct thousands separator.' },
    ],
  },
  {
    id: 'r3',
    version: '2.12',
    date: new Date(2026, 1, 20),
    title: 'Cleaner exports',
    summary: 'Two fixes for the reports finance teams send out at month end.',
    changes: [
      { kind: 'fixed', text: 'Exports to CSV keep the leading zeros of account codes.' },
      { kind: 'fixed', text: 'The aging report counts weekends correctly.' },
    ],
  },
];

export function ChangelogDemo({ motion, empty, locale }: DemoProps) {
  const Changelog = motion ? MotionChangelog : PlainChangelog;
  const [lastSeen, setLastSeen] = useState(new Date(2026, 2, 1));
  return (
    <Changelog
      releases={empty ? [] : RELEASES}
      lastSeen={lastSeen}
      onSubscribe={() => undefined}
      onMarkSeen={() => {
        setLastSeen(NOW);
      }}
      hasMore={!empty}
      onLoadMore={() => undefined}
      locale={locale}
    />
  );
}

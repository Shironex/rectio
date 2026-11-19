'use client';

import { Changelog, type ChangelogRelease } from '@rectio/blocks';
import { useState } from 'react';

export const RELEASES: ChangelogRelease[] = [
  {
    id: 'r1',
    version: '2.14',
    date: new Date(2026, 2, 17),
    title: 'Approvals on the go',
    summary: 'Approvers can now decide expenses from the notification itself.',
    changes: [
      { kind: 'new', text: 'Approve or reject an expense straight from its notification.' },
      { kind: 'improved', text: 'Receipts open at full size and keep their place when you zoom.' },
      { kind: 'fixed', text: 'Bulk approvals no longer skip the last selected row.' },
    ],
  },
  {
    id: 'r2',
    version: '2.13',
    date: new Date(2026, 1, 20),
    changes: [{ kind: 'fixed', text: 'CSV exports keep the leading zeros of account codes.' }],
  },
];

export const LAST_SEEN = new Date(2026, 2, 1);

/** The app keeps the reader's last visit and moves it when they mark the notes read. */
export default function ChangelogDemo() {
  const [lastSeen, setLastSeen] = useState(LAST_SEEN);
  return (
    <div className="w-full">
      <Changelog
        releases={RELEASES}
        lastSeen={lastSeen}
        onMarkSeen={() => {
          setLastSeen(new Date());
        }}
        locale="en-GB"
      />
    </div>
  );
}

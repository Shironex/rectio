'use client';

import { Changelog } from '@rectio/blocks/docs/motion';

const RELEASES = [
  {
    version: '2.4.0',
    date: '2026-03-04',
    title: 'Scheduled jobs',
    summary: 'Run a job on a cron schedule.',
    changes: [
      { type: 'feature' as const, text: 'Added halyard schedule.' },
      {
        type: 'fix' as const,
        text: 'Retries no longer double count.',
        ref: { label: 'PR 412', href: '/changes/412' },
      },
    ],
  },
  {
    version: '2.3.0',
    date: '2026-02-10',
    changes: [
      { type: 'breaking' as const, text: 'The queue option timeout is now in seconds.' },
      { type: 'improvement' as const, text: 'Workers start faster.' },
    ],
  },
];

export default function DocsChangelogDemoMotion() {
  return (
    <div className="w-full">
      <Changelog releases={RELEASES} level={3} />
    </div>
  );
}

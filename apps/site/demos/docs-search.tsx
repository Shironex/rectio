'use client';

import { DocsSearch, createLocalSearch } from '@rectio/blocks/docs';

const search = createLocalSearch([
  {
    id: 'intro',
    title: 'Introduction',
    href: '/intro',
    group: 'Get started',
    content: 'Halyard runs typed background jobs for TypeScript.',
  },
  {
    id: 'retries',
    title: 'Retries and backoff',
    href: '/jobs/retries',
    group: 'Guides',
    description: 'Retry failed jobs with a growing delay.',
    content: 'A failed job is retried with exponential backoff until it succeeds.',
  },
  {
    id: 'schedules',
    title: 'Schedules',
    href: '/schedules',
    group: 'Guides',
    content: 'Run a job on a cron schedule.',
  },
]);

export default function DocsSearchDemo() {
  return <DocsSearch search={search} recentKey={null} shortcut={null} />;
}

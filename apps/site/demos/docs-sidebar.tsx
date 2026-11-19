'use client';

import { DocsSidebar } from '@rectio/blocks/docs';

const SECTIONS = [
  {
    title: 'Get started',
    items: [
      { title: 'Introduction', href: '/intro' },
      { title: 'Install', href: '/install' },
    ],
  },
  {
    title: 'Guides',
    items: [
      {
        title: 'Jobs',
        href: '/jobs',
        items: [
          { title: 'Define a job', href: '/jobs/define' },
          { title: 'Retries', href: '/jobs/retries', badge: 'New' },
        ],
      },
      { title: 'Schedules', href: '/schedules', badge: { label: 'Beta', tone: 'beta' as const } },
    ],
  },
];

export default function DocsSidebarDemo() {
  return (
    <div className="w-64">
      <DocsSidebar sections={SECTIONS} currentHref="/jobs/retries" />
    </div>
  );
}

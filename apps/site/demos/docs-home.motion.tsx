'use client';

import { DocsHero, LinkCards } from '@rectio/blocks/docs/motion';

export default function DocsHomeDemoMotion() {
  return (
    <div className="flex w-full flex-col gap-10">
      <DocsHero
        eyebrow="Halyard 2.4"
        title="Typed background jobs for TypeScript"
        description="Define a job, enqueue it with a checked payload and let Halyard retry it."
        primary={{ label: 'Get started', href: '/intro' }}
        secondary={{ label: 'API reference', href: '/api' }}
        install="npm install @halyard/core"
      />
      <LinkCards
        title="Start here"
        items={[
          { title: 'Define a job', description: 'Name it and type its payload.', href: '/jobs' },
          { title: 'Retries', description: 'Back off and give up cleanly.', href: '/retries' },
          {
            title: 'Schedules',
            description: 'Run jobs on a cron.',
            href: '/schedules',
            badge: 'Beta',
          },
        ]}
      />
    </div>
  );
}

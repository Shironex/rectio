'use client';

import { DocsHeader, DocsLayout, DocsSidebar, DocsToc } from '@rectio/blocks/docs';

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
      { title: 'Define a job', href: '/jobs' },
      { title: 'Retries', href: '/retries', badge: 'New' },
    ],
  },
];

const HEADINGS = [
  { id: 'define', title: 'Define a job', level: 2 as const },
  { id: 'run', title: 'Run it', level: 2 as const },
];

export default function DocsLayoutDemo() {
  return (
    <div className="h-96 w-full overflow-y-auto rounded-panel border border-line">
      <DocsLayout
        className="min-h-full"
        header={
          <DocsHeader
            brand="Halyard"
            brandLabel="Halyard docs home"
            links={[
              { label: 'Docs', href: '/intro' },
              { label: 'API', href: '/api' },
            ]}
            currentHref="/intro"
            mobileNav={<DocsSidebar sections={SECTIONS} currentHref="/jobs" />}
          />
        }
        sidebar={<DocsSidebar sections={SECTIONS} currentHref="/jobs" />}
        toc={<DocsToc headings={HEADINGS} />}
      >
        <h1 className="font-display text-3xl text-fg">Define a job</h1>
        <p className="mt-3 text-fg-muted">A job is a typed function with a name.</p>
      </DocsLayout>
    </div>
  );
}

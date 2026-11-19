'use client';

import { DocsBreadcrumb, DocsPageMeta, DocsPager } from '@rectio/blocks/docs';

export default function DocsPageNavDemo() {
  return (
    <div className="flex w-full flex-col gap-6">
      <DocsBreadcrumb
        items={[
          { label: 'Docs', href: '/' },
          { label: 'Guides', href: '/guides' },
          { label: 'Retries' },
        ]}
      />
      <DocsPageMeta editHref="https://example.com/edit" lastUpdated="2026-03-04" locale="en" />
      <DocsPager
        prev={{ title: 'Define a job', href: '/jobs/define' }}
        next={{ title: 'Schedules', href: '/schedules' }}
      />
    </div>
  );
}

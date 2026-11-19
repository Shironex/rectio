'use client';

import { DocsToc } from '@rectio/blocks/docs';

const HEADINGS = [
  { id: 'install', title: 'Install', level: 2 as const },
  { id: 'define', title: 'Define a job', level: 2 as const },
  { id: 'payloads', title: 'Typed payloads', level: 3 as const },
  { id: 'retries', title: 'Retries', level: 2 as const },
];

export default function DocsTocDemo() {
  return (
    <div className="w-60">
      <DocsToc headings={HEADINGS} />
    </div>
  );
}

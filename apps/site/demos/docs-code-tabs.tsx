'use client';

import { CodeTabs, InstallTabs } from '@rectio/blocks/docs';

const ITEMS = [
  {
    label: 'TypeScript',
    lang: 'ts',
    code: "await queue.add('send-email', { to: 'ada@example.com' });",
  },
  {
    label: 'CLI',
    lang: 'sh',
    code: 'halyard enqueue send-email --to ada@example.com',
  },
];

export default function DocsCodeTabsDemo() {
  return (
    <div className="flex w-full flex-col gap-4">
      <InstallTabs command="npm install @halyard/core" />
      <CodeTabs items={ITEMS} label="Language" />
    </div>
  );
}

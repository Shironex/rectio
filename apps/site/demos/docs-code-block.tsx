'use client';

import { CodeBlock, type CodeLine } from '@rectio/blocks/docs';

const KEYWORD = 'var(--rx-code-token-keyword)';
const STRING = 'var(--rx-code-token-string)';

const TOKENS: CodeLine[] = [
  [
    { content: 'import', color: KEYWORD },
    { content: ' { defineJob } ' },
    { content: 'from', color: KEYWORD },
    { content: ' ' },
    { content: "'@halyard/core'", color: STRING },
    { content: ';' },
  ],
  [{ content: '' }],
  [
    { content: 'export', color: KEYWORD },
    { content: ' ' },
    { content: 'const', color: KEYWORD },
    { content: ' sendEmail = defineJob(' },
    { content: "'send-email'", color: STRING },
    { content: ', run);' },
  ],
];

const DIFF = `- retries: 1
+ retries: 5`;

export default function DocsCodeBlockDemo() {
  return (
    <div className="flex w-full flex-col gap-4">
      <CodeBlock tokens={TOKENS} lang="ts" title="jobs/send-email.ts" highlight={[3]} lineNumbers />
      <CodeBlock code={DIFF} lang="diff" />
    </div>
  );
}

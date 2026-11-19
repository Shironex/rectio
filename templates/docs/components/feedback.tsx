'use client';

import { DocsFeedback } from '@rectio/blocks/docs/motion';

import { SITE } from '@/data/site';

/**
 * "Was this page helpful?" With `SITE.collectFeedback` on, posts the page, the vote and the comment
 * as JSON to /api/docs-feedback on your own server; change the path to your endpoint. Off, it only
 * thanks the reader.
 */
export function PageFeedback({ page }: { page: string }) {
  return (
    <DocsFeedback
      onSubmit={async (value) => {
        if (!SITE.collectFeedback) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          return;
        }
        const response = await fetch('/api/docs-feedback', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ page, ...value }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) throw new Error(`feedback: ${String(response.status)}`);
      }}
    />
  );
}

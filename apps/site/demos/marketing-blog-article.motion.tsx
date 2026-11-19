'use client';

import { ArticleLayout } from '@rectio/blocks/marketing/motion';

export default function BlogArticleMotionDemo() {
  return (
    <div className="w-full">
      <ArticleLayout
        title="How to close the month in three days"
        description="The checklist our customers use, step by step."
        tag="Guide"
        date="2026-03-04"
        author={{ name: 'Ada Lindqvist', role: 'Co-founder' }}
        readingMinutes={6}
        back={{ label: 'All articles', href: '#articles' }}
        headings={[
          { id: 'start', title: 'Start before the month ends' },
          { id: 'review', title: 'Review in one pass' },
        ]}
        locale="en-GB"
      >
        <h2 id="start">Start before the month ends</h2>
        <p>Most of a close is waiting. Move the waiting to the days before it starts.</p>
        <h2 id="review">Review in one pass</h2>
        <p>Open the queue once, decide each item, and leave nothing half done.</p>
      </ArticleLayout>
    </div>
  );
}

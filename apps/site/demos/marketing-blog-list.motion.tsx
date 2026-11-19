'use client';

import { ArticleList } from '@rectio/blocks/marketing/motion';

const ARTICLES = [
  {
    id: 'close',
    title: 'How to close the month in three days',
    href: '#close',
    excerpt: 'The checklist our customers use, step by step.',
    date: '2026-03-04',
    author: { name: 'Ada Lindqvist' },
    tag: 'Guide',
    readingMinutes: 6,
  },
  {
    id: 'vat',
    title: 'VAT without the spreadsheet',
    href: '#vat',
    excerpt: 'Why every sum runs in minor units.',
    date: '2026-02-18',
    author: { name: 'Jon Reyes' },
    tag: 'Engineering',
    readingMinutes: 4,
  },
  {
    id: 'aging',
    title: 'Reading a receivables aging report',
    href: '#aging',
    excerpt: 'What the buckets tell you about cash.',
    date: '2026-01-29',
    author: { name: 'Sofia Novak' },
    readingMinutes: 5,
  },
];

export default function BlogListMotionDemo() {
  return (
    <div className="w-full">
      <ArticleList
        title="From the Northlake blog"
        articles={ARTICLES}
        viewAll={{ label: 'All articles', href: '#articles' }}
        locale="en-GB"
      />
    </div>
  );
}

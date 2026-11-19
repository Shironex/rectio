'use client';

import { HeroSplit } from '@rectio/blocks/marketing';

const VISUAL = (
  <div className="grid h-64 place-items-center rounded-panel bg-surface-sunken text-fg-muted">
    Your product, live
  </div>
);

export default function HeroSplitDemo() {
  return (
    <div className="w-full">
      <HeroSplit
        eyebrow="Finance, in one place"
        title="Every invoice, approval and payout in view"
        description="See what is owed, what is late and what waits for a decision, without a spreadsheet."
        primary={{ label: 'Start free', href: '#start' }}
        secondary={{ label: 'Book a demo', href: '#demo' }}
        visual={VISUAL}
      />
    </div>
  );
}

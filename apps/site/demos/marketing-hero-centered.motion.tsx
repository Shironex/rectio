'use client';

import { HeroCentered } from '@rectio/blocks/marketing/motion';

const VISUAL = (
  <div className="grid h-64 place-items-center rounded-panel bg-surface-sunken text-fg-muted">
    Your product, live
  </div>
);

export default function HeroCenteredMotionDemo() {
  return (
    <div className="w-full">
      <HeroCentered
        eyebrow="New: close checklists"
        title="Close the books in days, not weeks"
        description="Northlake keeps invoices, approvals and the ledger in one place, so month end stops being a project."
        primary={{ label: 'Start free', href: '#start' }}
        secondary={{ label: 'Book a demo', href: '#demo' }}
        visual={VISUAL}
      />
    </div>
  );
}

'use client';

import { HeroWordCycle } from '@rectio/blocks/marketing/motion';

const VISUAL = (
  <div className="grid h-64 place-items-center rounded-panel bg-surface-sunken text-fg-muted">
    Your product, live
  </div>
);

export default function HeroWordCycleMotionDemo() {
  return (
    <div className="w-full">
      <HeroWordCycle
        before="Close the books on"
        words={['invoices', 'payouts', 'approvals']}
        description="One workspace for everything month end asks of you."
        primary={{ label: 'Start free', href: '#start' }}
        visual={VISUAL}
      />
    </div>
  );
}

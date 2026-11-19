'use client';

import { FeatureBento } from '@rectio/blocks/marketing';

const VISUAL = (
  <div className="grid h-64 place-items-center rounded-panel bg-surface-sunken text-fg-muted">
    Your product, live
  </div>
);

const ITEMS = [
  {
    id: 'aging',
    title: 'Receivables aging',
    description: 'See how old what you are owed is.',
    visual: VISUAL,
    size: 'wide' as const,
  },
  {
    id: 'budget',
    title: 'Budget vs actual',
    description: 'Over or under plan, at a glance.',
    visual: VISUAL,
  },
  {
    id: 'journal',
    title: 'General journal',
    description: 'Debits and credits that balance.',
    tone: 'tinted' as const,
  },
];

export default function FeatureGridBentoDemo() {
  return (
    <div className="w-full">
      <FeatureBento title="The product, working" items={ITEMS} />
    </div>
  );
}

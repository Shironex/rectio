'use client';

import { FeatureRows } from '@rectio/blocks/marketing';

const VISUAL = (
  <div className="grid h-64 place-items-center rounded-panel bg-surface-sunken text-fg-muted">
    Your product, live
  </div>
);

const ROWS = [
  {
    id: 'approvals',
    eyebrow: 'Approvals',
    title: 'Decide in one pass',
    description: 'Every expense waiting for you, in one queue.',
    points: ['Approve or reject in a press', 'Comments stay with the expense'],
    action: { label: 'See approvals', href: '#approvals' },
    visual: VISUAL,
  },
  {
    id: 'cash',
    eyebrow: 'Cash',
    title: 'Know where cash stands',
    description: 'Inflow, outflow and net, by month or quarter.',
    points: ['Quarters add up to the cent', 'A table of the same figures'],
    visual: VISUAL,
  },
];

export default function FeatureGridRowsDemo() {
  return (
    <div className="w-full">
      <FeatureRows title="Built for the way finance works" rows={ROWS} />
    </div>
  );
}

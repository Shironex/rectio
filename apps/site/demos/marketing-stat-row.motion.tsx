'use client';

import { StatRow } from '@rectio/blocks/marketing/motion';

const STATS = [
  {
    id: 'teams',
    value: 1240,
    format: 'number' as const,
    label: 'finance teams close on Northlake',
    suffix: '+',
  },
  {
    id: 'invoices',
    value: 14200000,
    format: 'compact' as const,
    label: 'invoices sent last year',
  },
  {
    id: 'uptime',
    value: 0.998,
    format: 'percent' as const,
    label: 'uptime over twelve months',
  },
];

export default function StatRowMotionDemo() {
  return (
    <div className="w-full">
      <StatRow
        label="Northlake in numbers"
        lead="Finance teams run their month end on Northlake."
        stats={STATS}
        locale="en-GB"
      />
    </div>
  );
}

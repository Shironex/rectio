'use client';

import { ReceiptIcon, ShieldCheckIcon, StackIcon } from '@phosphor-icons/react';
import { FeatureIconGrid } from '@rectio/blocks/marketing';

const FEATURES = [
  {
    id: 'invoices',
    icon: <ReceiptIcon size={24} />,
    title: 'Invoices that chase themselves',
    description: 'Reminders go out on your schedule, in your tone.',
  },
  {
    id: 'ledger',
    icon: <StackIcon size={24} />,
    title: 'A ledger that balances',
    description: 'Every entry is checked in exact minor units.',
  },
  {
    id: 'secure',
    icon: <ShieldCheckIcon size={24} />,
    title: 'Safe by default',
    description: 'Encrypted at rest and in transit, hosted in the EU.',
  },
];

export default function FeatureGridIconsDemo() {
  return (
    <div className="w-full">
      <FeatureIconGrid
        eyebrow="Features"
        title="Everything month end needs"
        description="Small tools that do one job well."
        features={FEATURES}
      />
    </div>
  );
}

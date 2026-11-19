'use client';

import { HeroFloating } from '@rectio/blocks/marketing/motion';

const VISUAL = (
  <div className="grid h-64 place-items-center rounded-panel bg-surface-sunken text-fg-muted">
    Your product, live
  </div>
);

const CARDS = [
  { id: 'approval', position: 'top-start' as const, content: 'Expense approved: EUR 128.40' },
  { id: 'paid', position: 'top-end' as const, content: 'Invoice 1042 paid: EUR 4,800' },
  { id: 'cash', position: 'bottom-start' as const, content: 'Cash in: EUR 22,150 this week' },
  { id: 'late', position: 'bottom-end' as const, content: '3 invoices due today' },
];

export default function HeroFloatingMotionDemo() {
  return (
    <div className="w-full">
      <HeroFloating
        title="Money moves. Northlake keeps up."
        description="Approvals, payments and cash position update as they happen."
        primary={{ label: 'Start free', href: '#start' }}
        visual={VISUAL}
        cards={CARDS}
      />
    </div>
  );
}

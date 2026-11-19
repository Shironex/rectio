'use client';

import { CtaBand } from '@rectio/blocks/marketing';

export default function CtaBandDemo() {
  return (
    <div className="w-full">
      <CtaBand
        title="Close your next month in days"
        description="Start free. No card needed."
        primary={{ label: 'Start free', href: '#start' }}
        secondary={{ label: 'Book a demo', href: '#demo' }}
      />
    </div>
  );
}

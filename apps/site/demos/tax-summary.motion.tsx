'use client';

import { TaxSummary } from '@rectio/blocks/motion';

import { TAX_ENTRIES, TODAY } from './reporting-data';

export default function TaxSummaryMotionDemo() {
  return (
    <div className="w-full">
      <TaxSummary
        entries={TAX_ENTRIES}
        currency="EUR"
        locale="en-GB"
        period="Q1 2026, January to March"
        due={new Date(2026, 3, 25)}
        status="open"
        today={TODAY}
        onFile={() => undefined}
        onExport={() => undefined}
      />
    </div>
  );
}

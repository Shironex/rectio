'use client';

import { ProfitAndLoss } from '@rectio/blocks';

import { PL_LINES } from './reporting-data';

export default function ProfitAndLossDemo() {
  return (
    <div className="w-full">
      <ProfitAndLoss
        lines={PL_LINES}
        currency="EUR"
        locale="en-GB"
        period="Q1 2026"
        comparisonPeriod="Q1 2025"
      />
    </div>
  );
}

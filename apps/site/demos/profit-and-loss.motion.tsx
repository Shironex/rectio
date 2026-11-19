'use client';

import { ProfitAndLoss } from '@rectio/blocks/motion';

import { PL_LINES } from './reporting-data';

export default function ProfitAndLossMotionDemo() {
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

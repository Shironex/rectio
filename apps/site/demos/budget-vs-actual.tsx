'use client';

import { BudgetVsActual } from '@rectio/blocks';

import { BUDGET } from './finance-data';

export default function BudgetVsActualDemo() {
  return (
    <div className="w-full">
      <BudgetVsActual lines={BUDGET} period="Q1 2026" currency="EUR" locale="en-GB" />
    </div>
  );
}

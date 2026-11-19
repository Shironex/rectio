'use client';

import { BudgetVsActual } from '@rectio/blocks/motion';

import { BUDGET } from './finance-data';

export default function BudgetVsActualMotionDemo() {
  return (
    <div className="w-full">
      <BudgetVsActual lines={BUDGET} period="Q1 2026" currency="EUR" locale="en-GB" />
    </div>
  );
}

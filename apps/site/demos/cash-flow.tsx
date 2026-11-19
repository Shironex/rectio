'use client';

import { CashFlowChart } from '@rectio/blocks';

import { CASH_FLOW } from './finance-data';

export default function CashFlowDemo() {
  return (
    <div className="w-full">
      <CashFlowChart points={CASH_FLOW} currency="EUR" locale="en-GB" />
    </div>
  );
}

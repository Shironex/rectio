'use client';

import { PricingTable } from '@rectio/blocks/motion';

import { FEATURES, PLANS } from './pricing-table';

export default function PricingTableMotionDemo() {
  return (
    <div className="w-full">
      <PricingTable
        plans={PLANS}
        features={FEATURES}
        currency="EUR"
        locale="en-GB"
        currentPlanId="starter"
        onSelectPlan={() => undefined}
      />
    </div>
  );
}

'use client';

import { Payouts } from '@rectio/blocks';

import { OPS_TODAY, PAYOUTS } from './operations-data';

export default function PayoutsDemo() {
  return (
    <div className="w-full">
      <Payouts
        payouts={PAYOUTS}
        today={OPS_TODAY}
        currency="EUR"
        locale="en-GB"
        onRetry={() => undefined}
        onOpenPayout={() => undefined}
      />
    </div>
  );
}

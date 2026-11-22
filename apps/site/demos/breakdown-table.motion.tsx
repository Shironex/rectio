'use client';

import { BreakdownTable } from '@rectio/blocks/analytics/motion';

import { REVENUE_BY_CHANNEL, SPEND_BY_VENDOR } from './analytics.data';

export default function BreakdownTableMotionDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4">
      <BreakdownTable
        title="Revenue by channel"
        description="November, against October"
        items={REVENUE_BY_CHANNEL}
        limit={6}
        comparison="vs October"
        format="currency"
        currency="EUR"
        locale="en-GB"
      />
      <BreakdownTable
        title="Spend by vendor"
        description="This quarter, against last"
        items={SPEND_BY_VENDOR}
        variant="compact"
        better="down"
        comparison="vs last quarter"
        format="currency"
        currency="EUR"
        locale="en-GB"
      />
    </div>
  );
}

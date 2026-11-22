'use client';

import { FunnelChart } from '@rectio/motion/charts';

import { TRIAL_FUNNEL, COLLECTION_FUNNEL } from './analytics.data';

export default function FunnelChartMotionDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-12">
      <FunnelChart data={TRIAL_FUNNEL} locale="en-GB" />
      <FunnelChart
        data={COLLECTION_FUNNEL}
        orientation="vertical"
        format="currency"
        currency="EUR"
        locale="en-GB"
      />
    </div>
  );
}

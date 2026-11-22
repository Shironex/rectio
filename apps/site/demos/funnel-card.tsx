'use client';

import { FunnelCard } from '@rectio/blocks/analytics';

import { TRIAL_FUNNEL, TRIAL_FUNNEL_BEFORE } from './analytics.data';

export default function FunnelCardDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4">
      <FunnelCard
        title="Trial to paid"
        description="Last 30 days"
        stages={TRIAL_FUNNEL}
        previous={TRIAL_FUNNEL_BEFORE}
        comparison="vs the 30 days before"
        locale="en-GB"
      />
    </div>
  );
}

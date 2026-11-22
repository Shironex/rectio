'use client';

import { MetricTrend } from '@rectio/blocks/analytics/motion';

import { CHURN, MRR_WEEKLY } from './analytics.data';

export default function MetricTrendMotionDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricTrend
          label="Monthly recurring revenue"
          points={MRR_WEEKLY}
          previous={MRR_WEEKLY.at(-5)?.value}
          comparison="vs 4 weeks ago"
          format="currency"
          currency="EUR"
          locale="en-GB"
        />
        <MetricTrend
          label="Logo churn"
          points={CHURN}
          previous={CHURN.at(-2)?.value}
          comparison="vs October"
          better="down"
          format="percent"
          locale="en-GB"
        />
      </div>
      <MetricTrend
        variant="stacked"
        label="Monthly recurring revenue"
        description="Weekly, last 6 months"
        points={MRR_WEEKLY}
        previous={MRR_WEEKLY[0]?.value}
        comparison="since May"
        format="currency"
        currency="EUR"
        locale="en-GB"
        reference={{ value: 50000, label: 'Q4 target' }}
      />
    </div>
  );
}

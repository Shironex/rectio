'use client';

import { RadialGauge } from '@rectio/motion/charts';

import { QUOTA_BANDS } from './analytics.data';

export default function RadialGaugeMotionDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-12 md:grid-cols-2">
      <RadialGauge
        label="Quota attainment"
        value={0.82}
        max={1.25}
        target={1}
        marker={{ value: 0.74, label: 'Pace' }}
        bands={QUOTA_BANDS}
        format="percent"
        locale="en-GB"
      />
      <RadialGauge
        label="Cloud spend"
        value={31840}
        max={40000}
        target={36000}
        bands={[
          { to: 30000, label: 'Within' },
          { to: 36000, label: 'Watch' },
          { to: 40000, label: 'Over' },
        ]}
        better="lower"
        format="currency"
        currency="EUR"
        locale="en-GB"
      />
    </div>
  );
}

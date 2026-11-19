'use client';

import { Meter } from '@rectio/motion';

export default function MeterMotionDemo() {
  return (
    <div className="flex w-full max-w-xl flex-wrap items-center justify-center gap-10">
      <Meter
        value={93}
        label="Storage used"
        thresholds={{ warning: 75, critical: 90 }}
        levelLabels={{ critical: 'Nearly full' }}
      />
      <Meter
        variant="bar"
        value={78}
        label="API calls this month"
        thresholds={{ warning: 75, critical: 95 }}
        className="max-w-xs"
      />
    </div>
  );
}

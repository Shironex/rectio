'use client';

import { Meter } from '@rectio/ui';

export default function MeterDemo() {
  return (
    <div className="flex w-full max-w-xl flex-wrap items-center justify-center gap-10">
      <Meter
        value={93}
        label="Storage used"
        thresholds={{ warning: 75, critical: 90 }}
        levelLabels={{ warning: 'Filling up', critical: 'Nearly full' }}
        description="46.5 of 50 GB"
      />
      <div className="flex w-full max-w-xs flex-col gap-5">
        <Meter
          variant="bar"
          value={78}
          label="API calls this month"
          thresholds={{ warning: 75, critical: 95 }}
          levelLabels={{ warning: 'Above plan pace' }}
        />
        <Meter variant="bar" value={38} label="Budget spent" thresholds={{ warning: 75 }} />
      </div>
    </div>
  );
}

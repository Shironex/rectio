'use client';

import { ProgressCircle } from '@rectio/ui';

export default function ProgressCircleDemo() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-8">
      <ProgressCircle value={72} size="xl" label="Profile complete" showLabel />
      <ProgressCircle value={3} max={5} size="lg" tone="positive" label="Steps done" showLabel>
        3/5
      </ProgressCircle>
      <ProgressCircle value={40} label="Sync" />
      <ProgressCircle value={null} size="sm" label="Waiting" />
    </div>
  );
}

'use client';

import { ProgressCircle } from '@rectio/motion';

export default function ProgressCircleMotionDemo() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-8">
      <ProgressCircle value={72} size="xl" label="Profile complete" showLabel />
      <ProgressCircle value={3} max={5} size="lg" tone="positive" label="Steps done" showLabel>
        3/5
      </ProgressCircle>
    </div>
  );
}

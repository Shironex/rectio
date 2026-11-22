'use client';

import { GoalTracker } from '@rectio/blocks/analytics';

export default function GoalTrackerDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4">
      <GoalTracker
        label="New ARR this quarter"
        description="1 October to 31 December"
        value={412000}
        target={600000}
        start={new Date(2026, 9, 1)}
        end={new Date(2026, 11, 31)}
        today={new Date(2026, 10, 18)}
        format="currency"
        currency="EUR"
        locale="en-GB"
      />
      <GoalTracker
        variant="bar"
        label="Support replies within 4 hours"
        description="This month"
        value={1184}
        target={1500}
        start={new Date(2026, 10, 1)}
        end={new Date(2026, 10, 30)}
        today={new Date(2026, 10, 18)}
        locale="en-GB"
      />
    </div>
  );
}

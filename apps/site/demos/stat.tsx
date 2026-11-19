'use client';

import { Stat, StatGroup } from '@rectio/ui';

export default function StatDemo() {
  return (
    <StatGroup className="w-full">
      <Stat
        label="Active users"
        value="4,182"
        change={{ value: '12%', direction: 'up', favourable: true, comparison: 'vs last week' }}
      />
      <Stat
        label="Median response"
        value="182"
        unit="ms"
        change={{ value: '9 ms', direction: 'down', favourable: true }}
      />
      <Stat
        label="Churn"
        value="2.1%"
        change={{ value: '0.4 pt', direction: 'up', favourable: false }}
      />
      <Stat label="Open tickets" value="31" change={{ value: 'no change', direction: 'flat' }} />
    </StatGroup>
  );
}

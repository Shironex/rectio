'use client';

import { TimeSeriesChart } from '@rectio/blocks';

import { ACTIVE_USERS, SIGNUPS_BY_PLAN } from './chart.data';

export default function TimeSeriesChartDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4">
      <TimeSeriesChart
        title="Starter sign-ups"
        variant="area"
        series={SIGNUPS_BY_PLAN.slice(0, 1)}
        locale="en-GB"
        plotClassName="h-56"
      />
      <TimeSeriesChart
        title="Weekly active users"
        series={ACTIVE_USERS}
        baseline="fit"
        locale="en-GB"
        plotClassName="h-56"
      />
    </div>
  );
}

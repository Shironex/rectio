'use client';

import { TimeSeriesChart } from '@rectio/blocks/motion';

import { ACTIVE_USERS, REVENUE } from './chart.data';

export default function TimeSeriesChartMotionDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4">
      <TimeSeriesChart
        title="Revenue"
        variant="area"
        series={[{ id: 'revenue', label: 'Revenue', points: REVENUE.slice(-60) }]}
        format="currency"
        currency="EUR"
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

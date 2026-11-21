'use client';

import { LineChart } from '@rectio/motion/charts';

import { ACTIVE_USERS, REVENUE } from './chart.data';

export default function LineChartMotionDemo() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      <LineChart series={ACTIVE_USERS} locale="en-GB" baseline="fit" plotClassName="h-56" />
      <LineChart
        series={[{ id: 'revenue', label: 'Revenue', points: REVENUE.slice(-30) }]}
        format="currency"
        currency="EUR"
        locale="en-GB"
        references={[{ value: 2000, label: 'Daily target €2,000' }]}
        plotClassName="h-48"
      />
    </div>
  );
}

'use client';

import { AreaChart } from '@rectio/motion/charts';

import { REVENUE, SIGNUPS_BY_PLAN } from './chart.data';

export default function AreaChartMotionDemo() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      <AreaChart
        series={[{ id: 'revenue', label: 'Revenue', points: REVENUE }]}
        format="currency"
        currency="EUR"
        locale="en-GB"
        plotClassName="h-56"
      />
      <AreaChart series={SIGNUPS_BY_PLAN} stacked locale="en-GB" plotClassName="h-48" />
    </div>
  );
}

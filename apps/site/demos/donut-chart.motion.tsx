'use client';

import { DonutChart } from '@rectio/motion/charts';

import { PLAN_MIX, SPEND } from './chart.data';

export default function DonutChartMotionDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-10 md:grid-cols-2">
      <DonutChart data={PLAN_MIX} locale="en-GB" centerLabel="Accounts" />
      <DonutChart data={SPEND} format="currency" currency="EUR" locale="en-GB" />
    </div>
  );
}

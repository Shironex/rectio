'use client';

import { WaterfallChart } from '@rectio/motion/charts';

import { ARR_BRIDGE, CASH_BRIDGE } from './analytics.data';

export default function WaterfallChartMotionDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-12">
      <WaterfallChart data={CASH_BRIDGE} format="currency" currency="EUR" locale="en-GB" />
      <WaterfallChart
        data={ARR_BRIDGE}
        orientation="horizontal"
        format="currency"
        currency="EUR"
        locale="en-GB"
      />
    </div>
  );
}

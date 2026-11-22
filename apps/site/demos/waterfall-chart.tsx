'use client';

import { WaterfallChart } from '@rectio/ui/charts';

import { ARR_BRIDGE, CASH_BRIDGE } from './analytics.data';

export default function WaterfallChartDemo() {
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

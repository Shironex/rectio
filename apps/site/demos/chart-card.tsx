'use client';

import { DotsThreeIcon } from '@phosphor-icons/react';
import { Button, ChartCard, TrendChip } from '@rectio/ui';
import { AreaChart, DonutChart } from '@rectio/ui/charts';

import { PLAN_MIX, REVENUE } from './chart.data';

export default function ChartCardDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
      <ChartCard
        className="md:col-span-2"
        title="Revenue"
        description="Last 30 days, by day"
        value="€53,940"
        delta={<TrendChip value={0.058} locale="en-GB" comparison="vs previous period" />}
        actions={
          <Button variant="ghost" size="sm" iconOnly aria-label="More about revenue">
            <DotsThreeIcon weight="bold" />
          </Button>
        }
      >
        <AreaChart
          series={[{ id: 'revenue', label: 'Revenue', points: REVENUE.slice(-30) }]}
          format="currency"
          currency="EUR"
          locale="en-GB"
          plotClassName="h-48"
        />
      </ChartCard>
      <ChartCard title="Plan mix" description="Active accounts">
        <DonutChart data={PLAN_MIX} locale="en-GB" centerLabel="Accounts" />
      </ChartCard>
      <ChartCard title="Churn" description="Monthly" loading>
        <AreaChart series={[]} loading plotClassName="h-48" />
      </ChartCard>
    </div>
  );
}

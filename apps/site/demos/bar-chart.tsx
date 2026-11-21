'use client';

import { BarChart } from '@rectio/ui/charts';

import { CASHFLOW, MRR, TICKETS } from './chart.data';

export default function BarChartDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-10 md:grid-cols-2">
      <BarChart
        data={MRR}
        category="month"
        stacked
        series={[
          { key: 'starter', label: 'Starter' },
          { key: 'team', label: 'Team' },
          { key: 'enterprise', label: 'Enterprise' },
        ]}
        format="currency"
        currency="EUR"
        locale="en-GB"
        plotClassName="h-56"
        messages={{ categoryHeader: 'Month' }}
      />
      <BarChart
        data={CASHFLOW}
        category="month"
        series={[
          { key: 'invoiced', label: 'Invoiced' },
          { key: 'collected', label: 'Collected' },
        ]}
        format="currency"
        currency="EUR"
        locale="en-GB"
        plotClassName="h-56"
        messages={{ categoryHeader: 'Month' }}
      />
      <BarChart
        className="md:col-span-2"
        data={TICKETS}
        category="team"
        orientation="horizontal"
        labels
        series={[{ key: 'open', label: 'Open tickets' }]}
        locale="en-GB"
        messages={{ categoryHeader: 'Team' }}
      />
    </div>
  );
}

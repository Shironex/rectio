'use client';

import { Sparkline } from '@rectio/ui';

import { TREND } from './chart.data';

export default function SparklineDemo() {
  return (
    <div className="flex w-full max-w-md flex-col divide-y divide-line rounded-panel border border-line">
      {[
        { label: 'Net revenue', value: '€214,380', data: TREND, area: true },
        {
          label: 'Days sales outstanding',
          value: '38 days',
          data: [44, 43, 45, 42, 41, 42, 40, 39, 41, 39, 38, 38],
          area: false,
        },
        {
          label: 'Open approvals',
          value: '17',
          data: [15, 18, 16, 16, 19, 17, null, 18, 17, 16, 18, 17],
          area: false,
        },
      ].map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm text-fg-muted">{row.label}</span>
            <span className="text-lg font-strong numeric">{row.value}</span>
          </div>
          <Sparkline data={row.data} area={row.area} className="h-9 w-28" />
        </div>
      ))}
    </div>
  );
}

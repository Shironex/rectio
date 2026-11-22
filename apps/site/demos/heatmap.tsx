'use client';

import { Heatmap } from '@rectio/ui/charts';

import { DEPLOYS, RETENTION, RETENTION_COLUMNS, RETENTION_ROWS } from './analytics.data';

export default function HeatmapDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-12">
      <Heatmap variant="calendar" data={DEPLOYS} locale="en-GB" label="Deploys by day" />
      <Heatmap
        rows={RETENTION_ROWS}
        columns={RETENTION_COLUMNS}
        data={RETENTION}
        format="percent"
        locale="en-GB"
        rowHeader="Cohort"
        label="Logo retention by cohort"
      />
    </div>
  );
}

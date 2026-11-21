'use client';

import { TimeChart, type TimeChartProps } from '../chart/time-chart';

export interface AreaChartProps extends TimeChartProps {
  /** Stack the series, so the top edge is their total: revenue by plan, traffic by source. */
  stacked?: boolean | undefined;
}

/**
 * Figures over time as filled areas: one total given its weight, or parts stacked into a whole.
 * The same time axis, gaps, summary and table twin as LineChart.
 */
export function AreaChart({ stacked = false, ...props }: AreaChartProps) {
  return <TimeChart variant="area" stacked={stacked} {...props} />;
}

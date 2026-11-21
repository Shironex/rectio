'use client';

import { TimeChart, type TimeChartProps } from '../chart/time-chart';

export type LineChartProps = TimeChartProps;

/**
 * Figures over time as lines, for comparing a few series or reading a trend: dates in the
 * reader's language on round calendar steps, gaps that break the line, a legend, a summary for
 * screen readers and the same figures as a table on request.
 */
export function LineChart(props: LineChartProps) {
  return <TimeChart variant="line" {...props} />;
}

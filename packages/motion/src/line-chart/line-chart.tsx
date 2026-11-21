import { LineChart as PlainLineChart, type LineChartProps } from '@rectio/ui/charts';

import { ChartMotionParts } from '../chart/chart';

export type { LineChartProps };

/**
 * LineChart with the motion parts: lines draw along time on first view, and marks glide to new values when the data
 * changes. Same props; plain under reduced motion.
 */
export function LineChart(props: LineChartProps) {
  return (
    <ChartMotionParts>
      <PlainLineChart {...props} />
    </ChartMotionParts>
  );
}

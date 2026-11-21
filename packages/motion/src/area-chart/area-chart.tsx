import { AreaChart as PlainAreaChart, type AreaChartProps } from '@rectio/ui/charts';

import { ChartMotionParts } from '../chart/chart';

export type { AreaChartProps };

/**
 * AreaChart with the motion parts: areas are uncovered along time on first view, and marks glide to new values when the data
 * changes. Same props; plain under reduced motion.
 */
export function AreaChart(props: AreaChartProps) {
  return (
    <ChartMotionParts>
      <PlainAreaChart {...props} />
    </ChartMotionParts>
  );
}

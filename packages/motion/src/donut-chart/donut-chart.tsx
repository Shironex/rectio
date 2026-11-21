import { DonutChart as PlainDonutChart, type DonutChartProps } from '@rectio/ui/charts';

import { ChartMotionParts } from '../chart/chart';

export type { DonutChartProps };

/**
 * DonutChart with the motion parts: the ring's parts settle in around it on first view, and marks glide to new values when the data
 * changes. Same props; plain under reduced motion.
 */
export function DonutChart(props: DonutChartProps) {
  return (
    <ChartMotionParts>
      <PlainDonutChart {...props} />
    </ChartMotionParts>
  );
}

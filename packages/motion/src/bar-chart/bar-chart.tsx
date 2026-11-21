import { BarChart as PlainBarChart, type BarChartProps } from '@rectio/ui/charts';

import { ChartMotionParts } from '../chart/chart';

export type { BarChartProps };

/**
 * BarChart with the motion parts: bars grow from the zero line one after another on first view, and
 * glide to new values when the data changes. Same props; plain under reduced motion.
 */
export function BarChart<T extends object>(props: BarChartProps<T>) {
  return (
    <ChartMotionParts>
      <PlainBarChart {...props} />
    </ChartMotionParts>
  );
}

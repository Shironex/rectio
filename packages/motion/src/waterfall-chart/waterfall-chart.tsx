import { WaterfallChart as PlainWaterfallChart, type WaterfallChartProps } from '@rectio/ui/charts';

import { ChartMotionParts } from '../chart/chart';

export type { WaterfallChartProps };

/** WaterfallChart with the motion parts: steps grow one after another on first view, increases up from where they start and decreases down, and glide to new figures after. Same props; plain under reduced motion. */
export function WaterfallChart(props: WaterfallChartProps) {
  return (
    <ChartMotionParts>
      <PlainWaterfallChart {...props} />
    </ChartMotionParts>
  );
}

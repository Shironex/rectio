import { FunnelChart as PlainFunnelChart, type FunnelChartProps } from '@rectio/ui/charts';

import { ChartMotionParts } from '../chart/chart';

export type { FunnelChartProps };

/** FunnelChart with the motion parts: the stages grow from their start edge one after another on first view, the drop-off bands fade in behind them, and new figures glide. Same props; plain under reduced motion. */
export function FunnelChart(props: FunnelChartProps) {
  return (
    <ChartMotionParts>
      <PlainFunnelChart {...props} />
    </ChartMotionParts>
  );
}

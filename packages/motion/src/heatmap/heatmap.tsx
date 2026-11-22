import { Heatmap as PlainHeatmap, type HeatmapProps } from '@rectio/ui/charts';

import { ChartMotionParts } from '../chart/chart';

export type { HeatmapProps };

/** Heatmap with the motion parts: the grid is uncovered from its start side in one sweep on first view, and cells change colour smoothly when the figures change. Same props; plain under reduced motion. */
export function Heatmap(props: HeatmapProps) {
  return (
    <ChartMotionParts>
      <PlainHeatmap {...props} />
    </ChartMotionParts>
  );
}

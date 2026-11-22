import { RadialGauge as PlainRadialGauge, type RadialGaugeProps } from '@rectio/ui/charts';

import { ChartMotionParts } from '../chart/chart';

export type { RadialGaugeProps };

/** RadialGauge with the motion parts: the arc draws along the scale to its figure on first view and travels to new figures after. Same props; plain under reduced motion. */
export function RadialGauge(props: RadialGaugeProps) {
  return (
    <ChartMotionParts>
      <PlainRadialGauge {...props} />
    </ChartMotionParts>
  );
}

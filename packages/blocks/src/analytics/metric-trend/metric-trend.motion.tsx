import { ChartMotionParts } from '@rectio/motion/charts';

import { MotionParts } from '../../lib/motion-parts';
import { MetricTrend as PlainMetricTrend, type MetricTrendProps } from './metric-trend';

export type { MetricTrendProps };

/** MetricTrend with the motion parts: the figure counts to its value and the line fades up on first view. Plain under reduced motion. */
export function MetricTrend(props: MetricTrendProps) {
  return (
    <MotionParts>
      <ChartMotionParts>
        <PlainMetricTrend {...props} />
      </ChartMotionParts>
    </MotionParts>
  );
}

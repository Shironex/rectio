import { SaasMotionParts } from '../lib/saas-motion-parts';
import {
  TimeSeriesChart as PlainTimeSeriesChart,
  type TimeSeriesChartProps,
} from './time-series-chart';

export type { TimeSeriesChartProps };

/** TimeSeriesChart with the motion parts: lines draw from left to right once, on first view. */
export function TimeSeriesChart(props: TimeSeriesChartProps) {
  return (
    <SaasMotionParts>
      <PlainTimeSeriesChart {...props} />
    </SaasMotionParts>
  );
}

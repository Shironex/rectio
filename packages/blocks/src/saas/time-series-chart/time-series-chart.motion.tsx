import { ChartMotionParts } from '@rectio/motion/charts';

import { SaasMotionParts } from '../lib/saas-motion-parts';

import {
  TimeSeriesChart as PlainTimeSeriesChart,
  type TimeSeriesChartProps,
} from './time-series-chart';

export type { TimeSeriesChartProps };

/**
 * TimeSeriesChart with the SaaS motion parts and the chart motion: lines draw along time on first
 * view and glide to new figures after. Plain under reduced motion.
 */
export function TimeSeriesChart(props: TimeSeriesChartProps) {
  return (
    <SaasMotionParts>
      <ChartMotionParts>
        <PlainTimeSeriesChart {...props} />
      </ChartMotionParts>
    </SaasMotionParts>
  );
}

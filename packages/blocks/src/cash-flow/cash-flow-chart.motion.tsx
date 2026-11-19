import { MotionParts } from '../lib/motion-parts';
import { CashFlowChart as PlainCashFlowChart, type CashFlowChartProps } from './cash-flow-chart';

export type { CashFlowChartProps };

/** CashFlowChart with the motion parts: same props, plain under reduced motion. */
export function CashFlowChart(props: CashFlowChartProps) {
  return (
    <MotionParts>
      <PlainCashFlowChart {...props} />
    </MotionParts>
  );
}

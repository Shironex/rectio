import { MotionParts } from '../lib/motion-parts';
import { ProfitAndLoss as PlainProfitAndLoss, type ProfitAndLossProps } from './profit-and-loss';

export type { ProfitAndLossProps };

/** ProfitAndLoss with the motion parts: same props, plain under reduced motion. */
export function ProfitAndLoss(props: ProfitAndLossProps) {
  return (
    <MotionParts>
      <PlainProfitAndLoss {...props} />
    </MotionParts>
  );
}

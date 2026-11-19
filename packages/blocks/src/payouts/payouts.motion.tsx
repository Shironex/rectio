import { MotionParts } from '../lib/motion-parts';
import { Payouts as PlainPayouts, type PayoutsProps } from './payouts';

export type { PayoutsProps };

/** Payouts with the motion parts: same props, plain under reduced motion. */
export function Payouts(props: PayoutsProps) {
  return (
    <MotionParts>
      <PlainPayouts {...props} />
    </MotionParts>
  );
}

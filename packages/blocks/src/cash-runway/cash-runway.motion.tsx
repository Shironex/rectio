import { MotionParts } from '../lib/motion-parts';
import { CashRunway as PlainCashRunway, type CashRunwayProps } from './cash-runway';

export type { CashRunwayProps };

/** CashRunway with the motion parts: same props, plain under reduced motion. */
export function CashRunway(props: CashRunwayProps) {
  return (
    <MotionParts>
      <PlainCashRunway {...props} />
    </MotionParts>
  );
}

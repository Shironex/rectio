import { MotionParts } from '../lib/motion-parts';
import {
  BudgetVsActual as PlainBudgetVsActual,
  type BudgetVsActualProps,
} from './budget-vs-actual';

export type { BudgetVsActualProps };

/** BudgetVsActual with the motion parts: same props, plain under reduced motion. */
export function BudgetVsActual(props: BudgetVsActualProps) {
  return (
    <MotionParts>
      <PlainBudgetVsActual {...props} />
    </MotionParts>
  );
}

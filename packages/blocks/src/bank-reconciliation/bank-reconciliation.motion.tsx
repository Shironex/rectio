import { MotionParts } from '../lib/motion-parts';
import {
  BankReconciliation as PlainBankReconciliation,
  type BankReconciliationProps,
} from './bank-reconciliation';

export type { BankReconciliationProps };

/** BankReconciliation with the motion parts: same props, plain under reduced motion. */
export function BankReconciliation(props: BankReconciliationProps) {
  return (
    <MotionParts>
      <PlainBankReconciliation {...props} />
    </MotionParts>
  );
}

import { MotionParts } from '../lib/motion-parts';
import { Ledger as PlainLedger, type LedgerProps } from './ledger';

export type { LedgerProps };

/** Ledger with the motion parts: same props, plain under reduced motion. */
export function Ledger(props: LedgerProps) {
  return (
    <MotionParts>
      <PlainLedger {...props} />
    </MotionParts>
  );
}

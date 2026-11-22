'use client';

import { MotionParts } from '../../lib/motion-parts';
import { PayrollRun as PlainPayrollRun, type PayrollRunProps } from './payroll-run';

export type { PayrollRunProps };

/** PayrollRun with the motion parts: the run fades up on first view, rows rise into place and totals count to new figures. Same props; plain under reduced motion. */
export function PayrollRun(props: PayrollRunProps) {
  return (
    <MotionParts>
      <PlainPayrollRun {...props} />
    </MotionParts>
  );
}

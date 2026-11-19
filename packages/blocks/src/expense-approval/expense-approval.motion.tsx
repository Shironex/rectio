import { MotionParts } from '../lib/motion-parts';
import {
  ExpenseApproval as PlainExpenseApproval,
  type ExpenseApprovalProps,
} from './expense-approval';

export type { ExpenseApprovalProps };

/** ExpenseApproval with the motion parts: same props, plain under reduced motion. */
export function ExpenseApproval(props: ExpenseApprovalProps) {
  return (
    <MotionParts>
      <PlainExpenseApproval {...props} />
    </MotionParts>
  );
}

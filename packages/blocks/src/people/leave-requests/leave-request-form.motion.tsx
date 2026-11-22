'use client';

import { MotionParts } from '../../lib/motion-parts';
import {
  LeaveRequestForm as PlainLeaveRequestForm,
  type LeaveRequestFormProps,
} from './leave-request-form';

export type { LeaveRequestFormProps };

/** LeaveRequestForm with the motion parts: the form fades up on first view. Same props; plain under reduced motion. */
export function LeaveRequestForm(props: LeaveRequestFormProps) {
  return (
    <MotionParts>
      <PlainLeaveRequestForm {...props} />
    </MotionParts>
  );
}

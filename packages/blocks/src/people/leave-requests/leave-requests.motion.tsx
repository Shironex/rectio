'use client';

import { MotionParts } from '../../lib/motion-parts';
import { LeaveRequests as PlainLeaveRequests, type LeaveRequestsProps } from './leave-requests';

export type { LeaveRequestsProps };

/** LeaveRequests with the motion parts: the list fades up on first view. Same props; plain under reduced motion. */
export function LeaveRequests(props: LeaveRequestsProps) {
  return (
    <MotionParts>
      <PlainLeaveRequests {...props} />
    </MotionParts>
  );
}

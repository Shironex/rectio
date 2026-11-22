'use client';

import { MotionParts } from '../../lib/motion-parts';
import { Timesheet as PlainTimesheet, type TimesheetProps } from './timesheet';

export type { TimesheetProps };

/** Timesheet with the motion parts: the week fades up on first view and new rows rise into place. Same props; plain under reduced motion. */
export function Timesheet(props: TimesheetProps) {
  return (
    <MotionParts>
      <PlainTimesheet {...props} />
    </MotionParts>
  );
}

import { ChartMotionParts } from '@rectio/motion/charts';

import { MotionParts } from '../../lib/motion-parts';
import { GoalTracker as PlainGoalTracker, type GoalTrackerProps } from './goal-tracker';

export type { GoalTrackerProps };

/** GoalTracker with the motion parts: the arc sweeps to the value on first view and glides to new figures. Plain under reduced motion. */
export function GoalTracker(props: GoalTrackerProps) {
  return (
    <MotionParts>
      <ChartMotionParts>
        <PlainGoalTracker {...props} />
      </ChartMotionParts>
    </MotionParts>
  );
}

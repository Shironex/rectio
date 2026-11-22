import { daysBetween } from '../../lib/finance';

export type GoalStatus = 'met' | 'ahead' | 'on-track' | 'behind' | 'not-started' | 'ended';

export interface GoalPace {
  /** The share of the period gone by today, 0 to 1. */
  elapsed: number;
  /** Where the value should be today at an even pace. */
  expected: number;
  /** Where the value lands at the end of the period at today's pace; null before any time passed. */
  projected: number | null;
  /** Whole days left, counting today. */
  daysLeft: number;
  /** What is still needed per day left to reach the target; null once met or ended. */
  neededPerDay: number | null;
  status: GoalStatus;
}

/**
 * How a goal is pacing: the share of the period gone, where an even pace would be by now, where
 * today's pace lands and what each remaining day needs. On track is within `tolerance` (5% by
 * default) of the even pace either way. Dates are local calendar days; both ends count.
 */
export function goalPace(goal: {
  value: number;
  target: number;
  start: Date;
  end: Date;
  today: Date;
  tolerance?: number | undefined;
}): GoalPace {
  const tolerance = goal.tolerance ?? 0.05;
  const length = Math.max(1, daysBetween(goal.start, goal.end) + 1);
  const gone = Math.min(length, Math.max(0, daysBetween(goal.start, goal.today) + 1));
  const elapsed = gone / length;
  const expected = goal.target * elapsed;
  const projected = gone === 0 ? null : goal.value / elapsed;
  const daysLeft = length - gone;
  const met = goal.value >= goal.target;
  const status: GoalStatus = met
    ? 'met'
    : gone === 0
      ? 'not-started'
      : daysLeft === 0
        ? 'ended'
        : goal.value >= expected * (1 + tolerance)
          ? 'ahead'
          : goal.value >= expected * (1 - tolerance)
            ? 'on-track'
            : 'behind';
  return {
    elapsed,
    expected,
    projected,
    daysLeft,
    neededPerDay: met || daysLeft === 0 ? null : (goal.target - goal.value) / daysLeft,
    status,
  };
}

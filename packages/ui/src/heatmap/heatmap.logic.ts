// No 'use client': these run in a server component as well as in the chart.

/** About two years of weeks: the most a calendar draws, counting back from its latest day. */
export const MAX_CALENDAR_WEEKS = 106;

/**
 * A figure as the heatmap reads it. A heatmap counts, so a figure below zero is not a count: like a
 * figure that is not a number, it is missing (null), drawn apart from zero and named as no data.
 */
export function heatValue(value: number | null | undefined): number | null {
  return value === null || value === undefined || !Number.isFinite(value) || value < 0
    ? null
    : value;
}

/**
 * The step of a figure: 0 for zero, then 1 to `steps` in even bands up to `max`, so a figure at the
 * top of the scale (or past it) takes the last step. A figure below zero or not a number is missing
 * (null). A `max` that is not above zero puts every figure above zero on the last step.
 */
export function heatStep(value: number, max: number, steps: number): number | null {
  if (heatValue(value) === null) return null;
  if (value === 0) return 0;
  if (!(max > 0)) return steps;
  return Math.min(steps, Math.max(1, Math.ceil((value / max) * steps)));
}

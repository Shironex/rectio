/**
 * rectio analytics blocks, motion variant: the same names and props as `@rectio/blocks/analytics`,
 * built on `@rectio/motion/charts`. Figures count up, funnel stages grow in turn and gauges sweep to
 * their value on first view, then glide to new figures; reduced motion renders the plain blocks.
 */
export * from './index';
export { MetricTrend } from './metric-trend/metric-trend.motion';
export { BreakdownTable } from './breakdown-table/breakdown-table.motion';
export { FunnelCard } from './funnel-card/funnel-card.motion';
export { GoalTracker } from './goal-tracker/goal-tracker.motion';

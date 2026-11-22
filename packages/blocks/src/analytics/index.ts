/**
 * rectio analytics blocks, plain variant: dashboard tiles built from the charts in
 * `@rectio/ui/charts`. A metric with its trend, a breakdown of a total by its parts, a conversion
 * funnel with its worst step named, and a goal with its pace. The motioned twins have the same names
 * and props in `@rectio/blocks/analytics/motion`.
 */
export {
  METRIC_TREND_MESSAGES,
  MetricTrend,
  type MetricTrendMessages,
  type MetricTrendProps,
} from './metric-trend/metric-trend';
export {
  metricFigures,
  type MetricFigures,
  type MetricPoint,
} from './metric-trend/metric-trend.logic';
export {
  BREAKDOWN_TABLE_MESSAGES,
  BreakdownTable,
  type BreakdownTableMessages,
  type BreakdownTableProps,
} from './breakdown-table/breakdown-table';
export {
  breakdownModel,
  type BreakdownItem,
  type BreakdownModel,
  type BreakdownRow,
  type BreakdownSort,
  type BreakdownSortKey,
} from './breakdown-table/breakdown-table.logic';
export {
  FUNNEL_CARD_MESSAGES,
  FunnelCard,
  type FunnelCardMessages,
  type FunnelCardProps,
} from './funnel-card/funnel-card';
export { funnelInsight, type FunnelInsight } from './funnel-card/funnel-card.logic';
export {
  GOAL_TRACKER_MESSAGES,
  GoalTracker,
  type GoalTrackerMessages,
  type GoalTrackerProps,
} from './goal-tracker/goal-tracker';
export { goalPace, type GoalPace, type GoalStatus } from './goal-tracker/goal-tracker.logic';

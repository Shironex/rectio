/**
 * The rectio charts, a second entry point so the chart library loads only in apps that draw
 * charts: an app that never imports `@rectio/ui/charts` never ships Recharts.
 *
 *   import { AreaChart, BarChart } from '@rectio/ui/charts';
 *   import { ChartCard, Sparkline, TrendChip } from '@rectio/ui';
 *
 * Motioned twins with the same names and props live in `@rectio/motion/charts`.
 */
export {
  CHART_MESSAGES,
  CHART_PALETTE,
  ChartDataTable,
  ChartFrame,
  ChartLegend,
  ChartMotionProvider,
  ChartTooltip,
  Swatch,
  TOOLTIP_LIFT,
  activeDatum,
  chartColor,
  chartSurface,
  mergeMessages,
  niceRangeTicks,
  niceTicks,
  paletteColor,
  useChartMotion,
  useElementWidth,
  useMarkAnimation,
  type ChartColor,
  type ChartFrameProps,
  type ChartKind,
  type ChartMessages,
  type ChartMotion,
  type ChartStageProps,
  type ChartTableData,
  type ChartTooltipProps,
  type ChartTooltipRow,
  type LegendItem,
  type SwatchShape,
} from './chart/chart';
export {
  formatDuration,
  formatValue,
  relativeChange,
  type ValueFormat,
  type ValueFormatOptions,
} from './chart/chart-format';
export {
  crossesYear,
  fillGaps,
  formatMoment,
  formatTick,
  gapSpans,
  inferTimeScale,
  mergeSeries,
  summarizeSeries,
  timeTicks,
  weeklyMeans,
  type SeriesSummary,
  type TickUnit,
  type TimePoint,
  type TimeRow,
  type TimeScale,
  type TimeTicks,
} from './chart/time-axis';
export {
  TIME_CHART_MESSAGES,
  type ReferenceMark,
  type TimeChartMessages,
  type TimeChartProps,
  type TimeSeries,
} from './chart/time-chart';
export { LineChart, type LineChartProps } from './line-chart/line-chart';
export { AreaChart, type AreaChartProps } from './area-chart/area-chart';
export {
  BAR_CHART_MESSAGES,
  BarChart,
  type BarChartMessages,
  type BarChartProps,
  type BarSeries,
} from './bar-chart/bar-chart';
export {
  DONUT_CHART_MESSAGES,
  DonutChart,
  type DonutChartMessages,
  type DonutChartProps,
  type DonutSlice,
} from './donut-chart/donut-chart';

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
  HATCH,
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
  useMarkGlide,
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
  extent,
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
  hasGaps,
  inferTimeScale,
  mergeSeries,
  summarizeSeries,
  timeTicks,
  weeklyMeans,
  localDate,
  type SeriesSummary,
  type TickUnit,
  type TimePoint,
  type TimeRow,
  type TimeScale,
  type TimeTicks,
} from './chart/time-axis';
export {
  TIME_CHART_MESSAGES,
  seriesStyle,
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
export {
  FUNNEL_CHART_MESSAGES,
  FunnelChart,
  type FunnelChartMessages,
  type FunnelChartProps,
} from './funnel-chart/funnel-chart';
// Pure helpers from modules without 'use client', so a server component can call them.
export { funnelSteps, type FunnelStage, type FunnelStep } from './funnel-chart/funnel-chart.logic';
export {
  HEATMAP_MESSAGES,
  Heatmap,
  type HeatmapAxisItem,
  type HeatmapCalendarProps,
  type HeatmapCell,
  type HeatmapDay,
  type HeatmapMatrixProps,
  type HeatmapMessages,
  type HeatmapProps,
} from './heatmap/heatmap';
export { MAX_CALENDAR_WEEKS, heatStep, heatValue } from './heatmap/heatmap.logic';
export {
  WATERFALL_CHART_MESSAGES,
  WaterfallChart,
  type WaterfallChartMessages,
  type WaterfallChartProps,
} from './waterfall-chart/waterfall-chart';
export {
  waterfallBars,
  type WaterfallBar,
  type WaterfallRole,
  type WaterfallStep,
} from './waterfall-chart/waterfall-chart.logic';
export {
  RADIAL_GAUGE_MESSAGES,
  RadialGauge,
  type GaugeBand,
  type RadialGaugeMessages,
  type RadialGaugeProps,
} from './radial-gauge/radial-gauge';

/**
 * The motion add-on for the charts, its own entry point so the chart library and these parts load
 * only in apps that draw charts. Each export has the same name and props as its plain twin in
 * `@rectio/ui/charts`:
 *
 *   import { AreaChart, BarChart } from '@rectio/motion/charts';
 *
 * No animation library: entrances run on the Web Animations API and updates on Recharts' own
 * transitions, so the add-on costs a few hundred bytes over the plain charts.
 */
export { MotionPreferenceProvider, usePlainMotion, type MotionPreference } from './lib/mode';
export { ChartMotionParts } from './chart/chart';
export { LineChart, type LineChartProps } from './line-chart/line-chart';
export { AreaChart, type AreaChartProps } from './area-chart/area-chart';
export { BarChart, type BarChartProps } from './bar-chart/bar-chart';
export { DonutChart, type DonutChartProps } from './donut-chart/donut-chart';
export { FunnelChart, type FunnelChartProps } from './funnel-chart/funnel-chart';
export { Heatmap, type HeatmapProps } from './heatmap/heatmap';
export { WaterfallChart, type WaterfallChartProps } from './waterfall-chart/waterfall-chart';
export { RadialGauge, type RadialGaugeProps } from './radial-gauge/radial-gauge';

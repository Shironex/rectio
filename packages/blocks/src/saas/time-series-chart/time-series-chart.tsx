'use client';

import { ChartCard, TrendChip } from '@rectio/ui';
import {
  AreaChart,
  LineChart,
  Swatch,
  formatMoment,
  formatValue,
  inferTimeScale,
  mergeSeries,
  seriesStyle,
  type TimeChartProps,
} from '@rectio/ui/charts';
import { useState, type ReactNode } from 'react';

import { resolveLocale } from '../../lib/finance';
import { mergeMessages } from '../../lib/messages';
import { seriesFigures, seriesRange } from './time-series-chart.logic';

export interface TimeSeriesChartMessages {
  title: string;
  /** The description when none is given: the first and last moment. */
  range: (from: string, to: string) => string;
  /** Beside a change: what it is measured against. */
  sinceStart: string;
  /** The description when a narrow plot draws daily figures as weekly averages. */
  byWeek: (range: string) => string;
}

export const TIME_SERIES_CHART_MESSAGES: TimeSeriesChartMessages = {
  title: 'Over time',
  range: (from, to) => `${from} to ${to}`,
  sinceStart: 'over the range',
  byWeek: (range) => `${range}, by week, daily average`,
};

export interface TimeSeriesChartProps extends Omit<TimeChartProps, 'messages' | 'className'> {
  /** `line` for comparing series, `area` to give a single total its weight. */
  variant?: 'line' | 'area' | undefined;
  /** Stack the areas into a total (area only). */
  stacked?: boolean | undefined;
  title?: string | undefined;
  /** Replaces the date range under the title. */
  description?: ReactNode;
  /** Controls on the title row, such as a range switch. */
  actions?: ReactNode;
  /** Each series' latest figure and its change above the plot. On by default, for up to four series. */
  figures?: boolean | undefined;
  headingLevel?: 2 | 3 | 4 | undefined;
  /** The block's words; pass the keys you change. The chart's own words go in `chartMessages`. */
  messages?: Partial<TimeSeriesChartMessages> | undefined;
  chartMessages?: TimeChartProps['messages'];
  className?: string | undefined;
}

/**
 * A chart card over time, built from the kit: the card, a line or area chart and trend chips. One
 * series puts its latest figure and change in the card's headline; two to four list each series'
 * latest figure and change above the plot. The date range is the description unless you give one.
 */
export function TimeSeriesChart({
  variant = 'line',
  stacked,
  title,
  description,
  actions,
  figures = true,
  headingLevel,
  messages,
  chartMessages,
  className,
  ...chart
}: TimeSeriesChartProps) {
  const m = mergeMessages(TIME_SERIES_CHART_MESSAGES, messages);
  // A narrow plot draws daily figures as weekly averages; the description says so.
  const [weekly, setWeekly] = useState(false);
  const locale = resolveLocale(chart.locale);
  const written = (value: number) =>
    formatValue(value, chart.format, { locale, currency: chart.currency });
  // Money takes the skin's money face (a serif under editorial), like every other amount.
  const write = (value: number) =>
    chart.format === 'currency' ? (
      <span className="font-(family-name:--rx-money-family)">{written(value)}</span>
    ) : (
      written(value)
    );
  const scale = chart.scale ?? inferTimeScale(mergeSeries(chart.series));
  const range = seriesRange(chart.series);
  const items = chart.loading === true ? [] : seriesFigures(chart.series);
  const single = figures && items.length === 1 ? items[0] : undefined;
  const listed = figures && items.length > 1 && items.length <= 4;
  const chip = (change: number | null) =>
    change === null ? undefined : (
      <TrendChip value={change} locale={locale} comparison={m.sinceStart} />
    );
  const plot =
    variant === 'area' ? (
      <AreaChart
        {...chart}
        onWeeklyChange={setWeekly}
        locale={locale}
        stacked={stacked}
        legend={listed ? false : chart.legend}
        messages={chartMessages}
      />
    ) : (
      <LineChart
        {...chart}
        onWeeklyChange={setWeekly}
        locale={locale}
        legend={listed ? false : chart.legend}
        messages={chartMessages}
      />
    );
  return (
    <ChartCard
      title={title ?? m.title}
      description={
        description ??
        (range === null
          ? undefined
          : (weekly ? m.byWeek : (text: string) => text)(
              m.range(
                formatMoment(range.from, scale, locale),
                formatMoment(range.to, scale, locale),
              ),
            ))
      }
      actions={actions}
      loading={chart.loading}
      headingLevel={headingLevel}
      className={className}
      {...(single === undefined ? {} : { value: write(single.last), delta: chip(single.change) })}
    >
      {listed && (
        // The figures double as the legend: each keeps its series' colour and line shape.
        <dl data-slot="series-figures" className="flex flex-wrap gap-x-8 gap-y-3">
          {items.map((item) => {
            // Styled by its place among every series, as the plot styles it.
            const index = chart.series.findIndex((s) => s.id === item.id);
            const style = seriesStyle(chart.series[index] ?? {}, index);
            return (
              <div key={item.id} className="flex min-w-0 flex-col gap-1">
                <dt className="inline-flex items-center gap-2 text-sm text-fg-muted">
                  <Swatch color={style.tone} shape={style.dashed ? 'dashed' : 'line'} />
                  {item.label}
                </dt>
                <dd className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-xl font-strong tracking-tight text-fg numeric">
                    {write(item.last)}
                  </span>
                  {chip(item.change)}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      {plot}
    </ChartCard>
  );
}

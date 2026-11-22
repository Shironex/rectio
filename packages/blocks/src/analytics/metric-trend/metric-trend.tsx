'use client';

import { ChartCard, Skeleton, Sparkline, TrendChip, cn } from '@rectio/ui';
import { AreaChart, formatValue, type ReferenceMark, type ValueFormat } from '@rectio/ui/charts';
import { useId, type ReactNode } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { resolveLocale } from '../../lib/finance';
import { mergeMessages } from '../../lib/messages';
import { metricFigures, type MetricPoint } from './metric-trend.logic';

export interface MetricTrendMessages {
  /** Beside the change when no comparison is given. */
  sinceStart: string;
  /** Words for the way the range went. */
  rising: string;
  falling: string;
  steady: string;
  /** Names the trend line: "MRR, rising from €38,200 to €48,210". */
  trend: (info: { label: string; direction: string; from: string; to: string }) => string;
  /** The high and low under the stacked chart. */
  range: (high: string, low: string) => string;
  /** Shown when the range holds no figure. */
  empty: string;
}

export const METRIC_TREND_MESSAGES: MetricTrendMessages = {
  sinceStart: 'over the range',
  rising: 'rising',
  falling: 'falling',
  steady: 'steady',
  trend: ({ label, direction, from, to }) => `${label}, ${direction} from ${from} to ${to}`,
  range: (high, low) => `High ${high}, low ${low}`,
  empty: 'No figures yet',
};

export interface MetricTrendProps {
  /** What it measures: `Monthly recurring revenue`. */
  label: string;
  /** The figures over the range, oldest first or in any order. */
  points: readonly MetricPoint[];
  /** The figure to compare the latest against, such as the same metric a period ago. */
  previous?: number | null | undefined;
  /** What the change is measured against: `vs October`. */
  comparison?: ReactNode;
  /** Which way is good news, for the change's colour. Up by default. */
  better?: 'up' | 'down' | 'none' | undefined;
  format?: ValueFormat | undefined;
  currency?: string | undefined;
  locale?: string | undefined;
  /**
   * `inline`, a compact tile with the figure beside a sparkline, for a row of metrics; `stacked`,
   * a card with the figure over a full chart with its time axis.
   */
  variant?: 'inline' | 'stacked' | undefined;
  /** Under the label (stacked only): the period, `Last 12 months`. */
  description?: ReactNode;
  /** A mark the trend is read against, such as a target (stacked only). */
  reference?: ReferenceMark | undefined;
  loading?: boolean | undefined;
  headingLevel?: 2 | 3 | 4 | undefined;
  messages?: Partial<MetricTrendMessages> | undefined;
  className?: string | undefined;
}

/**
 * One metric and how it got there: the latest figure, its change against a comparison, and the
 * trend behind it. The figure and change are text; the line is named in words for assistive
 * technology, so nothing rests on the picture. `inline` fits a row of tiles, `stacked` a dashboard
 * column.
 */
export function MetricTrend({
  label,
  points,
  previous,
  comparison,
  better = 'up',
  format = 'number',
  currency,
  locale: requestedLocale,
  variant = 'inline',
  description,
  reference,
  loading,
  headingLevel = 3,
  messages,
  className,
}: MetricTrendProps) {
  const m = mergeMessages(METRIC_TREND_MESSAGES, messages);
  const locale = resolveLocale(requestedLocale);
  const { Reveal } = useBlockParts();
  const headingId = useId();
  const figures = loading === true ? null : metricFigures(points, previous);
  const write = (value: number) => formatValue(value, format, { locale, currency });
  const money = format === 'currency' && currency !== undefined;
  // Whole amounts drop the cents, as the charts write them; money keeps the skin's money face.
  const figure = (value: number, size: string) => (
    <span
      className={cn(
        size,
        'font-strong tracking-tight numeric',
        money && 'font-(family-name:--rx-money-family)',
      )}
    >
      {write(value)}
    </span>
  );
  const change = figures?.change ?? null;
  const chip =
    change === null ? undefined : (
      <TrendChip
        value={change}
        locale={locale}
        better={better}
        comparison={comparison ?? m.sinceStart}
      />
    );
  const direction =
    figures === null
      ? ''
      : figures.direction === 'up'
        ? m.rising
        : figures.direction === 'down'
          ? m.falling
          : m.steady;
  const named =
    figures === null
      ? undefined
      : m.trend({ label, direction, from: write(figures.first), to: write(figures.latest) });
  const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (variant === 'stacked') {
    return (
      <ChartCard
        title={label}
        description={description}
        loading={loading}
        headingLevel={headingLevel}
        className={className}
        {...(figures === null ? {} : { value: figure(figures.latest, 'text-3xl'), delta: chip })}
        footer={
          figures === null ? undefined : (
            <span className="numeric">{m.range(write(figures.high), write(figures.low))}</span>
          )
        }
      >
        <AreaChart
          series={[{ id: 'metric', label, points: sorted }]}
          format={format}
          currency={currency}
          locale={locale}
          legend={false}
          loading={loading}
          references={reference === undefined ? undefined : [reference]}
          plotClassName="h-44"
        />
      </ChartCard>
    );
  }

  const Heading = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';
  return (
    <section
      aria-labelledby={headingId}
      data-slot="block"
      className={cn(
        '@container flex min-w-0 flex-col rounded-panel border border-line bg-surface px-5 py-4 shadow-panel translucent-surface',
        className,
      )}
    >
      <Reveal className="flex min-w-0 flex-col gap-2">
        <Heading id={headingId} className="text-sm font-normal text-fg-muted">
          {label}
        </Heading>
        {loading === true ? (
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-12 w-28" />
          </div>
        ) : figures === null ? (
          <p className="text-sm text-fg-subtle">{m.empty}</p>
        ) : (
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
            <div className="flex min-w-0 flex-col items-start gap-1.5">
              {figure(figures.latest, 'text-3xl')}
              {chip}
            </div>
            <Sparkline
              data={sorted.map((p) => p.value)}
              area
              color={
                better === 'none' || figures.direction === 'flat'
                  ? 'series-1'
                  : (figures.direction === 'up') === (better === 'up')
                    ? 'series-1'
                    : 'series-2'
              }
              label={named}
              className="h-12 w-full max-w-40 @xs:w-32"
            />
          </div>
        )}
      </Reveal>
    </section>
  );
}

import { ChartLineIcon } from '@phosphor-icons/react';
import {
  SkeletonChart,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@rectio/ui';
import { useId, type ReactNode } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';

import { BlockPanel } from '../../lib/block-panel';
import {
  ChartFigure,
  ChartTooltip,
  TOOLTIP_LIFT,
  activeDatum,
  chartColor,
  niceTicks,
  type ChartColor,
} from '../../lib/chart';
import { EmptyNote } from '../../lib/empty-note';
import { Figures } from '../../lib/figures';
import { formatPercent, resolveLocale } from '../../lib/finance';
import { COMMON_MESSAGES, mergeMessages, type CommonMessages } from '../../lib/messages';
import { formatValue, type ValueFormat } from '../../lib/value-format';
import {
  formatMoment,
  formatTick,
  inferTimeScale,
  mergeSeries,
  pickTicks,
  summarizeSeries,
  tickNeedsYear,
  type SeriesSummary,
  type TimeScale,
  type TimeSeries,
} from './time-series-chart.logic';

export interface TimeSeriesChartMessages extends CommonMessages {
  title: string;
  /** Announced while `loading` is set. */
  loading: string;
  emptyTitle: string;
  emptyNote: string;
  /** The description: the first and last moment, such as "1 Mar 2026 to 30 Mar 2026". */
  range: (from: string, to: string) => string;
  /** Under a series' latest figure: its change since the first point, already written. */
  changeNote: (change: string, direction: 'up' | 'down' | 'flat') => string;
  /** Under a latest figure whose first point was zero, so there is no change to give. */
  noChangeNote: string;
  /** One sentence per series in the chart's summary, read before the plot. */
  seriesSummary: (info: {
    label: string;
    last: string;
    lastDate: string;
    first: string;
    firstDate: string;
    peak: string;
    peakDate: string;
  }) => string;
  /** The end of the summary: how to read the points one by one. */
  keyboardHint: string;
  tableCaption: string;
  /** The first column's header. */
  dateHeader: string;
}

export const TIME_SERIES_CHART_MESSAGES: TimeSeriesChartMessages = {
  ...COMMON_MESSAGES,
  title: 'Over time',
  loading: 'Loading chart',
  emptyTitle: 'Nothing to plot yet',
  emptyNote: 'Points appear here as soon as the first figures come in.',
  range: (from, to) => `${from} to ${to}`,
  changeNote: (change, direction) =>
    direction === 'flat' ? 'No change over the range' : `${change} over the range`,
  noChangeNote: 'Started from zero',
  seriesSummary: ({ label, last, lastDate, first, firstDate, peak, peakDate }) =>
    `${label} went from ${first} on ${firstDate} to ${last} on ${lastDate}, highest at ${peak} on ${peakDate}.`,
  keyboardHint: 'Use the arrow keys on the chart to read each point, or show the table.',
  tableCaption: 'Figures by date',
  dateHeader: 'Date',
};

/** Series colours in order: the three series tokens, then the sequence for more lines. */
const PALETTE: readonly ChartColor[] = [
  'series-1',
  'series-2',
  'series-3',
  'sequence-2',
  'sequence-4',
];

export interface TimeSeriesChartProps {
  /** One or more series on a shared time axis. Each line keeps its colour by position. */
  series: readonly TimeSeries[];
  /** `line` for comparing series, `area` to give a single total its weight. */
  variant?: 'line' | 'area';
  /** How values are written on the axis, in the tooltip and in the table. */
  format?: ValueFormat;
  /** The ISO currency, for `format="currency"`. */
  currency?: string;
  locale?: string;
  /** The step between points. Inferred from the dates when not given. */
  scale?: TimeScale;
  /** Shows a skeleton of the chart in place, announced once, while the figures load. */
  loading?: boolean;
  /** Show each series' latest figure and its change above the plot. On by default. */
  figures?: boolean;
  title?: string;
  /** Replaces the date range under the title. */
  description?: ReactNode;
  /** Controls on the title's row, such as a range switch. */
  actions?: ReactNode;
  /** Shown in the empty state under its note, such as a button that connects a source. */
  emptyAction?: ReactNode;
  /** Height of the plot, a token utility such as `h-64` (the default). */
  plotClassName?: string;
  /** Drop the panel frame, to place the chart inside a frame of your own. */
  bare?: boolean;
  headingLevel?: 2 | 3;
  /** The block's words; pass the keys you change. See `TIME_SERIES_CHART_MESSAGES`. */
  messages?: Partial<TimeSeriesChartMessages>;
  className?: string;
}

interface Datum extends Record<string, number | Date | null> {
  time: number;
  date: Date;
}

/**
 * Figures over time as a line or an area: dates on the axis in the reader's language, every series
 * named in a legend, the latest figure and its change read first, a summary for screen readers,
 * and the same figures as a table on request. Shows a skeleton while loading and a next step when
 * there is nothing to plot.
 */
export function TimeSeriesChart({
  series,
  variant = 'line',
  format = 'number',
  currency,
  locale: requestedLocale,
  scale: requestedScale,
  loading = false,
  figures = true,
  title,
  description,
  actions,
  emptyAction,
  plotClassName = 'h-64',
  bare,
  headingLevel,
  messages,
  className,
}: TimeSeriesChartProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(TIME_SERIES_CHART_MESSAGES, messages);
  const gradientId = useId().replace(/:/g, '');
  const rows = mergeSeries(series);
  const scale = requestedScale ?? inferTimeScale(rows);
  const withYear = tickNeedsYear(rows, scale);
  const write = (value: number, compact = false) =>
    formatValue(value, format, { locale, currency, compact });
  const moment = (date: Date) => formatMoment(date, scale, locale);
  const colorOf = (index: number): ChartColor => PALETTE[index % PALETTE.length] ?? 'series-1';

  const data: Datum[] = rows.map((row) => ({ time: row.time, date: row.date, ...row.values }));
  const first = rows[0];
  const last = rows.at(-1);
  const span =
    first === undefined || last === undefined
      ? undefined
      : m.range(moment(first.date), moment(last.date));
  const summaries = series
    .map(summarizeSeries)
    .filter((summary): summary is SeriesSummary => summary !== null);

  const values = rows.flatMap((row) =>
    Object.values(row.values).filter((v): v is number => v !== null),
  );
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  // Counts from zero with round steps; a range below zero keeps Recharts' own fit.
  const yTicks = min >= 0 ? niceTicks(max) : undefined;

  const tooltip = (props: TooltipContentProps) => {
    const datum = activeDatum(props, data);
    if (datum === undefined) return null;
    return (
      <ChartTooltip
        layout="row"
        title={moment(datum.date)}
        locale={locale}
        rows={series.map((s, index) => {
          const value = datum[s.id];
          return {
            label: s.label,
            amount: typeof value === 'number' ? value : 0,
            value: typeof value === 'number' ? write(value) : '',
            color: colorOf(index),
            shape: 'line' as const,
          };
        })}
      />
    );
  };

  const body = () => {
    if (loading) {
      return <SkeletonChart kind="line" label={m.loading} className="py-1" />;
    }
    if (rows.length === 0) {
      return (
        <EmptyNote title={m.emptyTitle} action={emptyAction} icon={ChartLineIcon}>
          {m.emptyNote}
        </EmptyNote>
      );
    }
    return (
      <>
        {figures && summaries.length > 0 && summaries.length <= 4 && (
          <Figures
            currency={currency}
            locale={locale}
            items={summaries.map((summary) => {
              const direction =
                summary.change === null || summary.change === 0
                  ? 'flat'
                  : summary.change > 0
                    ? 'up'
                    : 'down';
              return {
                label: summary.label,
                value: write(summary.last.value),
                note:
                  summary.change === null
                    ? m.noChangeNote
                    : m.changeNote(
                        formatPercent(summary.change, locale, { signed: true }),
                        direction,
                      ),
              };
            })}
          />
        )}
        <ChartFigure
          summary={[
            ...summaries.map((summary) =>
              m.seriesSummary({
                label: summary.label,
                first: write(summary.first.value),
                firstDate: moment(summary.first.date),
                last: write(summary.last.value),
                lastDate: moment(summary.last.date),
                peak: write(summary.peak.value),
                peakDate: moment(summary.peak.date),
              }),
            ),
            m.keyboardHint,
          ].join(' ')}
          legend={series.map((s, index) => ({
            label: s.label,
            color: colorOf(index),
            shape: 'line' as const,
          }))}
          plotClassName={plotClassName}
          showTableLabel={m.showTable}
          hideTableLabel={m.hideTable}
          table={
            <Table>
              <TableCaption className="sr-only">{m.tableCaption}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>{m.dateHeader}</TableHead>
                  {series.map((s) => (
                    <TableHead key={s.id} align="end">
                      {s.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.time}>
                    <TableHead
                      scope="row"
                      className="h-auto border-line bg-transparent font-normal text-fg"
                    >
                      {moment(row.date)}
                    </TableHead>
                    {series.map((s) => {
                      const value = row.values[s.id];
                      return (
                        <TableCell key={s.id} align="end" className="numeric">
                          {value === null || value === undefined ? '' : write(value)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          }
        >
          <ComposedChart
            responsive
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
            style={{ width: '100%', height: '100%' }}
          >
            {variant === 'area' && (
              <defs>
                {series.map((s, index) => (
                  <linearGradient
                    key={s.id}
                    id={`${gradientId}-${String(index)}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={chartColor(colorOf(index))} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={chartColor(colorOf(index))} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
            )}
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={pickTicks(rows)}
              tickFormatter={(time: number) => formatTick(new Date(time), scale, locale, withYear)}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              width="auto"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              {...(yTicks === undefined
                ? {}
                : { ticks: yTicks, domain: [0, yTicks.at(-1) ?? 'auto'] })}
              tickFormatter={(value: number) => write(value, true)}
            />
            <Tooltip
              content={tooltip}
              cursor={{ stroke: 'var(--rx-chart-reference)', strokeWidth: 1 }}
              // One line above the plot, over the legend, so it never covers the line it reads.
              position={{ y: -TOOLTIP_LIFT }}
              allowEscapeViewBox={{ x: false, y: true }}
              offset={16}
              isAnimationActive={false}
            />
            {series.map((s, index) => {
              const color = chartColor(colorOf(index));
              const shared = {
                dataKey: s.id,
                name: s.label,
                type: 'monotone' as const,
                stroke: color,
                strokeWidth: 2,
                dot: false,
                activeDot: { r: 4, fill: color, stroke: 'var(--rx-chart-halo)', strokeWidth: 2 },
                connectNulls: false,
                isAnimationActive: false,
              };
              return variant === 'area' ? (
                <Area key={s.id} {...shared} fill={`url(#${gradientId}-${String(index)})`} />
              ) : (
                <Line key={s.id} {...shared} />
              );
            })}
          </ComposedChart>
        </ChartFigure>
      </>
    );
  };

  return (
    <BlockPanel
      title={title ?? m.title}
      description={loading ? undefined : (description ?? span)}
      actions={actions}
      bare={bare ?? false}
      headingLevel={headingLevel ?? 2}
      aria-busy={loading || undefined}
      className={className}
      bodyClassName="gap-4"
    >
      {body()}
    </BlockPanel>
  );
}

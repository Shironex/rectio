import { TrendDownIcon, WarningCircleIcon } from '@phosphor-icons/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@rectio/ui';
import { useState, type ReactNode } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type LabelProps,
} from 'recharts';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import { EmptyNote } from '../lib/empty-note';
import {
  ChartFigure,
  ChartTooltip,
  TOOLTIP_LIFT,
  activeDatum,
  chartColor,
  niceTicks,
  type LegendItem,
  type TooltipRow,
} from '../lib/chart';
import { Figures } from '../lib/figures';
import { formatCompactMoney, resolveLocale } from '../lib/finance';
import { COMMON_MESSAGES, mergeMessages, type CommonMessages } from '../lib/messages';
import { Segmented } from '../lib/segmented';
import {
  cashRunway,
  type BalancePoint,
  type PlannedChange,
  type RunwayMonth,
} from './cash-runway.logic';

/** The months the burn can be averaged over. */
export type RunwayWindow = 3 | 6 | 12;
const WINDOWS: readonly RunwayWindow[] = [3, 6, 12];

export interface CashRunwayProps {
  /** Cash in and out per month, oldest first or in any order; the last month ends today. */
  history: readonly RunwayMonth[];
  /** Cash at the end of the last month of history. */
  balance: number;
  currency: string;
  locale?: string;
  /** One-offs ahead, such as a funding round or an annual licence, added to the projection. */
  planned?: readonly PlannedChange[];
  /** Cash you do not want to go below, drawn as a line and named in words. */
  threshold?: number;
  /** Runway under this many months is emphasised as a warning. */
  alertMonths?: number;
  defaultWindow?: RunwayWindow;
  /** How many months the projection may run at most. */
  horizon?: number;
  title?: string;
  /** Shown in the empty state under its note, such as a button that connects a bank account. */
  emptyAction?: ReactNode;
  /** The block's words; pass the keys you change. See `CASH_RUNWAY_MESSAGES`. */
  messages?: Partial<CashRunwayMessages>;
  className?: string;
}

/**
 * A month for the words: `text` is the month and year in the block's locale ("November 2026"),
 * `date` its first day, for a language that needs another grammatical case of the month's name.
 */
export interface MonthWords {
  text: string;
  date: Date;
}

export interface CashRunwayMessages extends CommonMessages {
  title: string;
  /**
   * Under the title, in plain words: when cash runs out at this burn, or that it is not shrinking;
   * `threshold` is the month cash drops below the minimum, when one is set and reached.
   */
  summary: (
    status: 'burning' | 'not-burning' | 'beyond-horizon',
    zeroMonth: MonthWords | undefined,
    threshold: { amount: ReactNode; month: MonthWords } | undefined,
  ) => ReactNode;
  /** The window switch's name. */
  window: string;
  /** Each window option: "3 mo". */
  windowOption: (months: number) => string;
  cashNow: string;
  /** Under the balance: "at the end of Mar 2026". */
  asOf: (month: MonthWords) => string;
  averageBurn: string;
  averageInflow: string;
  /** Under the burn: "per month, 3-month average". */
  burnNote: (months: number) => string;
  runway: string;
  /** The runway figure: "8.4 months"; `months` is formatted already, `count` picks the plural. */
  runwayMonths: (months: string, count: number) => string;
  notBurning: string;
  /** Under the runway figure. */
  runwayNote: (
    status: 'burning' | 'not-burning' | 'beyond-horizon',
    zeroMonth: MonthWords | undefined,
    horizonMonth: MonthWords | undefined,
  ) => string;
  actual: string;
  projected: string;
  minimumCash: string;
  /** Beside the point where the projection meets zero. */
  cashOut: string;
  /** After the runway note when planned one-offs shape the projection. */
  includesPlanned: (count: number) => string;
  /** Before the runway note when it falls under the alert: "Under 6 months". */
  runwayShort: (months: number) => string;
  balance: string;
  month: string;
  note: string;
  /** A planned change in the table and tooltip: "Series A, +€500,000". */
  plannedLine: (label: string, amount: ReactNode) => ReactNode;
  chartSummary: (summary: string) => string;
  emptyTitle: string;
  emptyNote: string;
  /** The line under the title while there is no history. */
  emptySummary: string;
  tableCaption: (currency: string) => string;
}

export const CASH_RUNWAY_MESSAGES: CashRunwayMessages = {
  ...COMMON_MESSAGES,
  title: 'Cash runway',
  summary: (status, zeroMonth, threshold) => (
    <>
      {status === 'burning' ? (
        threshold === undefined ? (
          <>
            At this burn, cash runs out in{' '}
            <strong className="font-medium text-negative-strong">{zeroMonth?.text}</strong>
          </>
        ) : (
          // In the order they happen: under the minimum first, then out.
          <>
            At this burn, cash drops below the {threshold.amount} minimum in{' '}
            <strong className="font-medium text-warning-strong">{threshold.month.text}</strong> and
            runs out in{' '}
            <strong className="font-medium text-negative-strong">{zeroMonth?.text}</strong>
          </>
        )
      ) : (
        <>
          {status === 'beyond-horizon'
            ? 'At this burn, cash lasts past the forecast'
            : 'Cash is growing: more comes in than goes out'}
          {threshold !== undefined && (
            <>
              , and drops below the {threshold.amount} minimum in{' '}
              <strong className="font-medium text-warning-strong">{threshold.month.text}</strong>
            </>
          )}
        </>
      )}
    </>
  ),
  window: 'Average over',
  windowOption: (months) => `${String(months)} mo`,
  cashNow: 'Cash now',
  asOf: (month) => `at the end of ${month.text}`,
  averageBurn: 'Average burn',
  averageInflow: 'Average net inflow',
  burnNote: (months) =>
    months === 1 ? 'per month, last month' : `per month, ${String(months)}-month average`,
  runway: 'Runway',
  runwayMonths: (months, count) => `${months} ${count === 1 ? 'month' : 'months'}`,
  notBurning: 'Not burning',
  runwayNote: (status, zeroMonth, horizonMonth) =>
    status === 'burning'
      ? `Cash out in ${zeroMonth?.text ?? ''}`
      : status === 'beyond-horizon'
        ? `Lasts past ${horizonMonth?.text ?? ''}`
        : 'Cash grows each month',
  actual: 'Actual',
  projected: 'Projected',
  minimumCash: 'Minimum cash',
  cashOut: 'Cash out',
  includesPlanned: (count) =>
    `Counts ${String(count)} planned ${count === 1 ? 'change' : 'changes'}`,
  runwayShort: (months) => `Under ${String(months)} months`,
  balance: 'Balance',
  month: 'Month',
  note: 'Note',
  plannedLine: (label, amount) => (
    <>
      {label}, {amount}
    </>
  ),
  chartSummary: (summary) =>
    `Month-end cash balance, actual then projected at the average burn. ${summary}. Use the arrow keys on the chart to read each month, or show the table.`,
  emptySummary: 'Nothing booked yet',
  emptyTitle: 'No cash history yet',
  emptyNote: 'Runway appears once a month of cash in and out is booked.',
  tableCaption: (currency) => `Month-end cash balance, in ${currency}`,
};

interface Datum {
  key: string;
  label: string;
  point: BalancePoint;
  actual: number | null;
  /** The projection, starting from the last actual month so the two lines join. */
  projected: number | null;
}

/** "Mar 26": short enough for an axis tick, with the year so a long projection reads. */
function monthTick(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit' }).format(date);
}

function monthLong(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
}

function monthWords(date: Date, locale: string): MonthWords {
  return { text: monthLong(date, locale), date };
}

/**
 * How long the cash lasts: the balance now, the average monthly burn over a window you choose, the
 * runway in months, and a chart of month-end balances, actual then projected toward the zero line,
 * with the month cash runs out said in words and the same figures as a table.
 */
/**
 * A label drawn into the plot, ringed in the surface colour so a line that crosses it does not
 * strike it through. On a reference line it sits above the line at its start; at a point it sits
 * below and to the left, in the margin under zero where no line runs.
 */
function ChartNote({
  viewBox,
  at,
  children,
}: {
  viewBox: LabelProps['viewBox'];
  at: 'line' | 'dot';
  children: string;
}) {
  if (viewBox === undefined || !('x' in viewBox)) return null;
  const { x, y, width } = viewBox;
  return (
    <text
      x={at === 'line' ? x + 6 : x + width / 2 - 10}
      y={at === 'line' ? y - 6 : y + width / 2 + 14}
      textAnchor={at === 'line' ? 'start' : 'end'}
      className="fill-chart-axis text-xs"
      style={{ paintOrder: 'stroke', stroke: 'var(--rx-chart-halo)', strokeWidth: 4 }}
    >
      {children}
    </text>
  );
}

export function CashRunway({
  history,
  balance,
  currency,
  locale: requestedLocale,
  planned = [],
  threshold,
  alertMonths = 6,
  defaultWindow = 3,
  horizon = 24,
  title,
  emptyAction,
  messages,
  className,
}: CashRunwayProps) {
  const locale = resolveLocale(requestedLocale);
  const m = mergeMessages(CASH_RUNWAY_MESSAGES, messages);
  const { Money } = useBlockParts();
  const months = new Set(history.map((h) => h.month.getFullYear() * 12 + h.month.getMonth())).size;
  // Offer only the windows the history can fill, and always the shortest.
  const windows = WINDOWS.filter((w, index) => index === 0 || w <= months);
  const [averageOver, setAverageOver] = useState<RunwayWindow>(
    windows.includes(defaultWindow) ? defaultWindow : 3,
  );
  const runway = cashRunway(history, balance, currency, {
    window: averageOver,
    threshold,
    planned,
    horizon,
  });
  const actual = runway.series.filter((p) => p.kind === 'actual');
  const lastActual = actual.at(-1);
  const data: Datum[] = runway.series.map((point) => ({
    key: point.key,
    label: monthTick(point.month, locale),
    point,
    actual: point.kind === 'actual' ? point.balance : null,
    // The plot stops at the zero line; the table carries the true figure past it.
    projected:
      point.kind === 'projected'
        ? Math.max(0, point.balance)
        : point === lastActual
          ? point.balance
          : null,
  }));
  const ticks = niceTicks(Math.max(threshold ?? 0, ...runway.series.map((p) => p.balance)));
  const thresholdDatum =
    runway.thresholdMonth === null
      ? undefined
      : data.find((d) => d.point.month.getTime() === runway.thresholdMonth?.getTime());
  const zeroDatum = data.find((d) => d.point.kind === 'projected' && d.point.balance <= 0);
  const zeroMonth = runway.zeroMonth === null ? undefined : monthWords(runway.zeroMonth, locale);
  const horizonMonth = runway.series.at(-1);
  const thresholdWords =
    threshold !== undefined && runway.thresholdMonth !== null
      ? {
          amount: <Money amount={threshold} currency={currency} locale={locale} />,
          month: monthWords(runway.thresholdMonth, locale),
        }
      : undefined;
  const runwayCount = runway.months === null ? 0 : Math.floor(runway.months * 10) / 10;
  const low = runway.months !== null && runway.months < alertMonths;
  const summaryText = (() => {
    if (runway.status === 'burning') return m.runwayNote('burning', zeroMonth, undefined);
    if (runway.status === 'beyond-horizon')
      return m.runwayNote(
        'beyond-horizon',
        undefined,
        horizonMonth === undefined ? undefined : monthWords(horizonMonth.month, locale),
      );
    return m.runwayNote('not-burning', undefined, undefined);
  })();

  // The runway counts planned one-offs up to the month cash runs out; say so, or it will not
  // reconcile with balance over burn.
  const zeroIndex = runway.series.findIndex((p) => p.kind === 'projected' && p.balance <= 0);
  const plannedCount = runway.series
    .slice(0, zeroIndex === -1 ? undefined : zeroIndex + 1)
    .reduce((count, p) => count + (p.kind === 'projected' ? p.planned.length : 0), 0);
  const runwayNote =
    plannedCount > 0 ? (
      <>
        {summaryText}. {m.includesPlanned(plannedCount)}
      </>
    ) : (
      summaryText
    );

  const tooltip = (props: TooltipContentProps) => {
    const datum = activeDatum(props, data);
    if (datum === undefined) return null;
    const rows: TooltipRow[] = [
      {
        label: datum.point.kind === 'actual' ? m.actual : m.projected,
        amount: datum.point.balance,
        color: 'series-1',
        shape: datum.point.kind === 'actual' ? 'line' : 'dashed',
        strong: true,
      },
      ...datum.point.planned.map((change) => ({ label: change.label, amount: change.amount })),
    ];
    return (
      <ChartTooltip
        layout="row"
        title={monthLong(datum.point.month, locale)}
        currency={currency}
        locale={locale}
        rows={rows}
      />
    );
  };

  const note = (point: BalancePoint) => (
    <>
      {point.kind === 'actual' ? m.actual : m.projected}
      {point.planned.map((change, index) => (
        <span key={index} className="block">
          {m.plannedLine(
            change.label,
            <Money
              amount={change.amount}
              currency={currency}
              locale={locale}
              signDisplay="exceptZero"
            />,
          )}
        </span>
      ))}
    </>
  );

  const legend: LegendItem[] = [
    { label: m.actual, color: 'series-1', shape: 'line' },
    ...(runway.series.some((p) => p.kind === 'projected')
      ? [{ label: m.projected, color: 'series-1' as const, shape: 'dashed' as const }]
      : []),
    ...(threshold === undefined
      ? []
      : [{ label: m.minimumCash, color: 'reference' as const, shape: 'dashed' as const }]),
  ];

  return (
    <BlockPanel
      title={title ?? m.title}
      description={
        history.length === 0 ? m.emptySummary : m.summary(runway.status, zeroMonth, thresholdWords)
      }
      className={className}
      bodyClassName="gap-4"
    >
      {history.length === 0 ? (
        <EmptyNote title={m.emptyTitle} action={emptyAction} icon={TrendDownIcon}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <>
          {/* Its own row in every theme and width, right above the figures it changes. */}
          {windows.length > 1 && (
            <div className="flex items-center gap-2">
              {/* The switch's name in sight as well as on the group: "3 mo" alone says too little. */}
              <span aria-hidden className="text-sm text-fg-muted">
                {m.window}
              </span>
              <Segmented
                label={m.window}
                value={String(averageOver)}
                onValueChange={(value) => {
                  setAverageOver(Number(value) as RunwayWindow);
                }}
                options={windows.map((w) => ({ value: String(w), label: m.windowOption(w) }))}
              />
            </div>
          )}
          <Figures
            currency={currency}
            locale={locale}
            items={[
              {
                label: m.cashNow,
                amount: balance,
                signed: balance < 0,
                note:
                  lastActual === undefined
                    ? undefined
                    : m.asOf(monthWords(lastActual.month, locale)),
              },
              runway.burn.burn > 0
                ? {
                    label: m.averageBurn,
                    amount: runway.burn.burn,
                    note: m.burnNote(runway.burn.months),
                  }
                : {
                    label: m.averageInflow,
                    amount: runway.burn.net,
                    signed: true,
                    note: m.burnNote(runway.burn.months),
                  },
              {
                label: m.runway,
                value:
                  runway.months === null
                    ? m.notBurning
                    : m.runwayMonths(
                        new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
                          runwayCount,
                        ),
                        runwayCount,
                      ),
                ...(low ? { emphasis: 'warning' as const } : {}),
                // Under the alert the note says so in words, with an icon, not by colour alone.
                note: low ? (
                  <span className="inline-flex items-start gap-1">
                    <WarningCircleIcon
                      aria-hidden
                      weight="bold"
                      className="mt-0.5 size-3.5 shrink-0"
                    />
                    <span>
                      {m.runwayShort(alertMonths)}. {runwayNote}
                    </span>
                  </span>
                ) : (
                  runwayNote
                ),
              },
            ]}
          />
          <ChartFigure
            summary={m.chartSummary(summaryText)}
            legend={legend}
            plotClassName="h-64"
            showTableLabel={m.showTable}
            hideTableLabel={m.hideTable}
            table={
              <Table>
                <TableCaption className="sr-only">{m.tableCaption(currency)}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>{m.month}</TableHead>
                    <TableHead align="end">{m.balance}</TableHead>
                    <TableHead className="hidden @md:table-cell">{m.note}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runway.series.map((point) => (
                    <TableRow key={point.key}>
                      <TableCell className="align-top">
                        <span className="block">{monthLong(point.month, locale)}</span>
                        {/* A narrow block folds the note under the month. */}
                        <span className="block text-sm text-fg-muted @md:hidden">
                          {note(point)}
                        </span>
                      </TableCell>
                      <TableCell align="end" className="align-top">
                        <Money
                          amount={point.balance}
                          currency={currency}
                          locale={locale}
                          className={cn(point.balance < 0 && 'text-negative-strong')}
                        />
                      </TableCell>
                      <TableCell className="hidden align-top text-fg-muted @md:table-cell">
                        {note(point)}
                      </TableCell>
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
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                // An even step from the first month, so no month drops out between two others.
                interval="equidistantPreserveStart"
                minTickGap={16}
              />
              <YAxis
                ticks={ticks}
                // A margin under zero leaves the cash-out ring and its label clear of the axis.
                domain={[-(ticks[ticks.length - 1] ?? 1) * 0.1, ticks[ticks.length - 1] ?? 1]}
                width="auto"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tickFormatter={(value: number) => formatCompactMoney(value, currency, locale)}
              />
              <ReferenceLine y={0} className="rx-zero" stroke="var(--rx-chart-baseline)" />
              {threshold !== undefined && (
                <ReferenceLine
                  y={threshold}
                  stroke={chartColor('reference')}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={(props: LabelProps) => (
                    <ChartNote viewBox={props.viewBox} at="line">
                      {m.minimumCash}
                    </ChartNote>
                  )}
                />
              )}
              {data
                .filter((d) => d.point.kind === 'projected' && d.point.planned.length > 0)
                .map((d) => (
                  // A planned one-off on the projection, so the step in the line has a cause.
                  <ReferenceDot
                    key={`planned-${d.key}`}
                    x={d.label}
                    y={Math.max(0, d.point.balance)}
                    r={4.5}
                    fill={chartColor('series-1')}
                    stroke="var(--rx-chart-halo)"
                    strokeWidth={2}
                  />
                ))}
              {threshold !== undefined && thresholdDatum !== undefined && (
                // Where the projection first falls under the minimum.
                <ReferenceDot
                  x={thresholdDatum.label}
                  y={Math.max(0, thresholdDatum.point.balance)}
                  r={4}
                  fill="var(--rx-chart-halo)"
                  stroke={chartColor('reference')}
                  strokeWidth={2}
                />
              )}
              {runway.zeroMonth !== null && zeroDatum !== undefined && (
                // Where the projection meets the zero line: the month cash runs out.
                <ReferenceDot
                  x={zeroDatum.label}
                  y={0}
                  r={5}
                  fill="var(--rx-chart-halo)"
                  stroke="var(--rx-negative)"
                  strokeWidth={2}
                  label={(props: LabelProps) => (
                    <ChartNote viewBox={props.viewBox} at="dot">
                      {m.cashOut}
                    </ChartNote>
                  )}
                />
              )}
              <Tooltip
                content={tooltip}
                cursor={{ stroke: 'var(--rx-chart-reference)', strokeWidth: 1 }}
                position={{ y: -TOOLTIP_LIFT }}
                allowEscapeViewBox={{ x: false, y: true }}
                offset={16}
                isAnimationActive={false}
              />
              <Line
                dataKey="actual"
                name={m.actual}
                stroke={chartColor('series-1')}
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 4.5,
                  fill: chartColor('series-1'),
                  stroke: 'var(--rx-chart-halo)',
                  strokeWidth: 2,
                }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="projected"
                name={m.projected}
                stroke={chartColor('series-1')}
                strokeWidth={2}
                strokeDasharray="6 5"
                dot={false}
                activeDot={{
                  r: 4.5,
                  fill: 'var(--rx-chart-halo)',
                  stroke: chartColor('series-1'),
                  strokeWidth: 2,
                }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartFigure>
        </>
      )}
    </BlockPanel>
  );
}

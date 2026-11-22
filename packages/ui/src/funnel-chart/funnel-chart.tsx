'use client';

import { ArrowDownIcon, ArrowRightIcon } from '@phosphor-icons/react/ssr';
import type { ReactNode } from 'react';

import {
  CHART_MESSAGES,
  ChartDataTable,
  ChartFrame,
  HATCH,
  mergeMessages,
  useMarkGlide,
  type ChartColor,
  type ChartMessages,
} from '../chart/chart';
import { formatValue, type ValueFormat } from '../chart/chart-format';
import { cn } from '../lib/cn';

export interface FunnelStage {
  /** Stable key for the stage. */
  id: string;
  label: string;
  /** How many reached this stage. Negative figures count as zero. */
  value: number;
}

/** One stage with what it kept from the stage before and from the first. */
export interface FunnelStep {
  id: string;
  label: string;
  value: number;
  /** Its share of the first stage, 0 to 1 (more when a stage outgrows the first). */
  ofFirst: number;
  /** Its share of the stage before; 1 for the first stage, null after an empty stage. */
  ofPrevious: number | null;
  /** How many left between the stage before and this one; 0 for the first, negative when it grew. */
  dropped: number;
  /** The stage before's length as a share of the longest stage, where the drop-off band ends. */
  previousLength: number;
  /** This stage's length as a share of the longest stage. */
  length: number;
}

/**
 * The stages with their conversion and drop-off. Lengths are shares of the longest stage, so a
 * stage that grows past the first still fits; conversion is always against the stage before.
 */
export function funnelSteps(data: readonly FunnelStage[]): FunnelStep[] {
  const values = data.map((stage) => (Number.isFinite(stage.value) ? Math.max(0, stage.value) : 0));
  const first = values[0] ?? 0;
  const longest = Math.max(0, ...values);
  const length = (value: number) => (longest === 0 ? 0 : value / longest);
  return data.map((stage, index) => {
    const value = values[index] ?? 0;
    const previous = index === 0 ? value : (values[index - 1] ?? 0);
    return {
      id: stage.id,
      label: stage.label,
      value,
      ofFirst: first === 0 ? 0 : value / first,
      ofPrevious: index === 0 ? 1 : previous === 0 ? null : value / previous,
      dropped: previous - value,
      previousLength: length(previous),
      length: length(value),
    };
  });
}

export interface FunnelChartMessages extends ChartMessages {
  stageHeader: string;
  valueHeader: string;
  ofPreviousHeader: string;
  ofFirstHeader: string;
  droppedHeader: string;
  tableCaption: string;
  /** The legend key of the bars. */
  reached: string;
  /** The legend key of the hatched band: those lost since the stage before. */
  droppedOff: string;
  /** Between two stages: what carried on and how many left. */
  step: (info: { kept: string; dropped: string; droppedShare: string; grew: boolean }) => string;
  /** The summary, read before the plot. */
  summary: (info: {
    first: string;
    firstLabel: string;
    last: string;
    lastLabel: string;
    overall: string;
    stages: number;
    biggestDrop?: { label: string; share: string } | undefined;
  }) => string;
}

export const FUNNEL_CHART_MESSAGES: FunnelChartMessages = {
  ...CHART_MESSAGES,
  stageHeader: 'Stage',
  valueHeader: 'Reached',
  ofPreviousHeader: 'Of previous',
  ofFirstHeader: 'Of first',
  droppedHeader: 'Dropped',
  tableCaption: 'Each stage of the funnel',
  reached: 'Reached',
  droppedOff: 'Dropped off',
  keyboardHint: 'Every stage is listed with its figures, or show the table.',
  step: ({ kept, dropped, droppedShare, grew }) =>
    grew
      ? `${kept} carried on, ${dropped} joined`
      : `${kept} carried on, ${dropped} left (${droppedShare})`,
  summary: ({ first, firstLabel, last, lastLabel, overall, stages, biggestDrop }) =>
    `${String(stages)} stages from ${firstLabel} (${first}) to ${lastLabel} (${last}), ${overall} overall.` +
    (biggestDrop === undefined
      ? ''
      : ` The biggest drop is into ${biggestDrop.label}, ${biggestDrop.share} lost.`),
};

export interface FunnelChartProps {
  data: readonly FunnelStage[];
  /** `horizontal` lists stages down the page; `vertical` stands them side by side as columns. */
  orientation?: 'horizontal' | 'vertical' | undefined;
  format?: ValueFormat | undefined;
  currency?: string | undefined;
  locale?: string | undefined;
  /** The bars' colour token. The first series by default. */
  color?: ChartColor | undefined;
  /** The hatched band of those lost since the stage before. On by default. */
  dropOff?: boolean | undefined;
  summary?: string | undefined;
  loading?: boolean | undefined;
  emptyAction?: ReactNode;
  tableToggle?: boolean | undefined;
  /** Height of the columns in the vertical funnel, a token utility. `h-48` by default. */
  plotClassName?: string | undefined;
  messages?: Partial<FunnelChartMessages> | undefined;
  className?: string | undefined;
}

const BAR: Record<string, string> = {
  'series-1': 'bg-chart-series-1',
  'series-2': 'bg-chart-series-2',
  'series-3': 'bg-chart-series-3',
  'sequence-1': 'bg-chart-sequence-1',
  'sequence-2': 'bg-chart-sequence-2',
  'sequence-3': 'bg-chart-sequence-3',
  'sequence-4': 'bg-chart-sequence-4',
  'sequence-5': 'bg-chart-sequence-5',
  reference: 'bg-chart-reference',
};

const percentOf = (share: number) => `${String(Math.min(1, Math.max(0, share)) * 100)}%`;

/**
 * Stages of a journey, each shorter than the last: visits to sign-ups to trials to paid. Every
 * stage prints its figure and its share of the first, and between stages the conversion and how
 * many left, so nothing is read from bar lengths alone. A hatched band shows what each stage lost.
 */
export function FunnelChart({
  data,
  orientation = 'horizontal',
  format = 'number',
  currency,
  locale,
  color = 'series-1',
  dropOff = true,
  summary,
  loading,
  emptyAction,
  tableToggle,
  plotClassName = 'h-48',
  messages,
  className,
}: FunnelChartProps) {
  const m = mergeMessages(FUNNEL_CHART_MESSAGES, messages);
  const glide = useMarkGlide();
  const steps = funnelSteps(data);
  const vertical = orientation === 'vertical';
  const write = (value: number) => formatValue(value, format, { locale, currency });
  const percent = (share: number) => formatValue(share, 'percent', { locale });
  const first = steps[0];
  const last = steps.at(-1);
  const empty = first === undefined || first.value === 0;

  const between = (step: FunnelStep) =>
    m.step({
      kept: step.ofPrevious === null ? percent(0) : percent(step.ofPrevious),
      dropped: write(Math.abs(step.dropped)),
      droppedShare: step.ofPrevious === null ? percent(0) : percent(1 - step.ofPrevious),
      grew: step.dropped < 0,
    });

  const biggest = steps
    .slice(1)
    .filter((step) => step.ofPrevious !== null && step.dropped > 0)
    .reduce<FunnelStep | undefined>(
      (top, step) =>
        top === undefined || (step.ofPrevious ?? 1) < (top.ofPrevious ?? 1) ? step : top,
      undefined,
    );

  const written =
    summary ??
    (first === undefined || last === undefined
      ? ''
      : [
          m.summary({
            first: write(first.value),
            firstLabel: first.label,
            last: write(last.value),
            lastLabel: last.label,
            overall: percent(last.ofFirst),
            stages: steps.length,
            biggestDrop:
              biggest === undefined
                ? undefined
                : { label: biggest.label, share: percent(1 - (biggest.ofPrevious ?? 1)) },
          }),
          m.keyboardHint,
        ].join(' '));

  const bar = BAR[color] ?? 'bg-chart-series-1';
  const band = (length: number, start: number) => (
    // What the stage lost since the one before: the reference colour under surface stripes.
    <span
      aria-hidden
      data-chart-mark="fade"
      className={cn('rx-mark absolute rounded-badge bg-chart-reference opacity-60', glide)}
      style={{
        backgroundImage: HATCH,
        ...(vertical
          ? { insetInline: 0, bottom: percentOf(start), height: percentOf(length - start) }
          : {
              insetBlock: 0,
              insetInlineStart: percentOf(start),
              width: percentOf(length - start),
            }),
      }}
    />
  );

  return (
    <ChartFrame
      kind="funnel"
      loading={loading}
      empty={empty}
      emptyAction={emptyAction}
      summary={written}
      legend={
        dropOff && steps.length > 1
          ? [
              { label: m.reached, color },
              { label: m.droppedOff, color: 'reference', shape: 'hatched' },
            ]
          : undefined
      }
      tableToggle={tableToggle}
      plotClassName={loading === true || empty ? plotClassName : 'h-auto'}
      messages={m}
      className={className}
      table={
        <ChartDataTable
          caption={m.tableCaption}
          headers={[
            m.stageHeader,
            m.valueHeader,
            m.ofPreviousHeader,
            m.ofFirstHeader,
            m.droppedHeader,
          ]}
          rows={steps.map((step, index) => ({
            key: step.id,
            header: step.label,
            cells: [
              write(step.value),
              index === 0 || step.ofPrevious === null ? '' : percent(step.ofPrevious),
              percent(step.ofFirst),
              index === 0 ? '' : write(step.dropped),
            ],
          }))}
        />
      }
    >
      {vertical ? (
        <ol data-slot="funnel" className="m-0 flex list-none items-stretch gap-2 p-0 sm:gap-3">
          {steps.map((step, index) => (
            <li key={step.id} className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="m-0 flex flex-col">
                <span className="truncate text-sm font-strong text-fg numeric">
                  {write(step.value)}
                </span>
                <span className="text-xs text-fg-muted numeric">{percent(step.ofFirst)}</span>
              </p>
              <div aria-hidden className={cn('relative w-full', plotClassName)}>
                {dropOff && index > 0 && band(step.previousLength, step.length)}
                <span
                  data-chart-mark="grow-y"
                  className={cn('rx-mark absolute inset-x-0 bottom-0 rounded-badge', bar, glide)}
                  style={{ height: percentOf(step.length) }}
                />
              </div>
              <p className="m-0 flex flex-col gap-0.5">
                <span className="text-sm text-fg wrap-anywhere">{step.label}</span>
                {index > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-fg-muted numeric">
                    <ArrowRightIcon aria-hidden weight="bold" className="size-3 shrink-0" />
                    <span className="sr-only">{between(step)}</span>
                    <span aria-hidden>
                      {step.ofPrevious === null ? percent(0) : percent(step.ofPrevious)}
                    </span>
                  </span>
                )}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <ol data-slot="funnel" className="m-0 flex list-none flex-col p-0">
          {steps.map((step, index) => (
            <li key={step.id} className="flex flex-col">
              {index > 0 && (
                // The step between two stages: what carried on, and how many left.
                <p className="m-0 flex items-center gap-1.5 py-1.5 ps-1 text-xs text-fg-muted numeric">
                  <ArrowDownIcon aria-hidden weight="bold" className="size-3 shrink-0" />
                  {between(step)}
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <p className="m-0 flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-fg">{step.label}</span>
                  <span className="flex shrink-0 items-baseline gap-2">
                    <span className="text-sm font-strong text-fg numeric">{write(step.value)}</span>
                    <span className="w-12 text-end text-xs text-fg-muted numeric">
                      {percent(step.ofFirst)}
                    </span>
                  </span>
                </p>
                <div aria-hidden className="relative h-6 w-full">
                  {dropOff && index > 0 && band(step.previousLength, step.length)}
                  <span
                    data-chart-mark="grow-x"
                    className={cn('rx-mark absolute inset-y-0 start-0 rounded-badge', bar, glide)}
                    style={{ width: percentOf(step.length) }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </ChartFrame>
  );
}

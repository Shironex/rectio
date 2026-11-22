'use client';

import { Badge, ChartCard, cn, type BadgeTone } from '@rectio/ui';
import { RadialGauge, formatValue, useMarkGlide, type ValueFormat } from '@rectio/ui/charts';
import type { ReactNode } from 'react';

import { resolveLocale } from '../../lib/finance';
import { mergeMessages, plural } from '../../lib/messages';
import { goalPace, type GoalStatus } from './goal-tracker.logic';

export interface GoalTrackerMessages {
  status: Record<GoalStatus, string>;
  target: string;
  /** The dashed mark: where an even pace would be today. */
  pace: string;
  ofTarget: (share: string) => string;
  projected: string;
  /** Under the projection: its share of the target. */
  projectedShare: (share: string) => string;
  daysLeft: string;
  days: (count: number) => string;
  neededPerDay: string;
  /** The needed figure once nothing more is needed. */
  nothingNeeded: string;
  /** Read by the bar meter: "New ARR: €412,000 of €600,000. Behind pace." */
  summary: (info: { label: string; value: string; target: string; status: string }) => string;
}

export const GOAL_TRACKER_MESSAGES: GoalTrackerMessages = {
  status: {
    met: 'Target met',
    ahead: 'Ahead of pace',
    'on-track': 'On pace',
    behind: 'Behind pace',
    'not-started': 'Not started',
    ended: 'Period ended',
  },
  target: 'Target',
  pace: 'Pace today',
  ofTarget: (share) => `${share} of target`,
  projected: 'Projected',
  projectedShare: (share) => `${share} of target`,
  daysLeft: 'Days left',
  days: (count) => plural(count, { one: '1 day', other: `${String(count)} days` }, 'en'),
  neededPerDay: 'Needed per day',
  nothingNeeded: 'None',
  summary: ({ label, value, target, status }) => `${label}: ${value} of ${target}. ${status}.`,
};

const TONE: Record<GoalStatus, BadgeTone> = {
  met: 'positive',
  ahead: 'positive',
  'on-track': 'info',
  behind: 'warning',
  'not-started': 'neutral',
  ended: 'neutral',
};

export interface GoalTrackerProps {
  /** What the goal counts: `New ARR this quarter`. */
  label: string;
  value: number;
  target: number;
  /** The first and last day of the goal's period; both count. */
  start: Date;
  end: Date;
  /** Today, for the pace. The current date by default; pass it for a server render or a test. */
  today?: Date | undefined;
  format?: ValueFormat | undefined;
  currency?: string | undefined;
  locale?: string | undefined;
  /**
   * `gauge`, a radial gauge with the target and today's pace marked, for a card of its own;
   * `bar`, a straight track with the same marks, for a narrow column or a stack of goals.
   */
  variant?: 'gauge' | 'bar' | undefined;
  description?: ReactNode;
  actions?: ReactNode;
  loading?: boolean | undefined;
  headingLevel?: 2 | 3 | 4 | undefined;
  messages?: Partial<GoalTrackerMessages> | undefined;
  className?: string | undefined;
}

/**
 * A goal over a period: how far it has come, where an even pace would be by today, where today's
 * pace lands at the end and what each remaining day needs. The state is a word in a badge
 * (ahead, on pace, behind) and every mark on the gauge or bar is listed in text beside it.
 */
export function GoalTracker({
  label,
  value,
  target,
  start,
  end,
  today,
  format = 'number',
  currency,
  locale: requestedLocale,
  variant = 'gauge',
  loading,
  messages,
  ...card
}: GoalTrackerProps) {
  const m = mergeMessages(GOAL_TRACKER_MESSAGES, messages);
  const locale = resolveLocale(requestedLocale);
  const pace = goalPace({ value, target, start, end, today: today ?? new Date() });
  // Projections and paces are estimates: counts and amounts round to whole units.
  const write = (figure: number) =>
    formatValue(format === 'percent' ? figure : Math.round(figure), format, { locale, currency });
  const percent = (fraction: number) => formatValue(fraction, 'percent', { locale });
  const money = format === 'currency' && currency !== undefined;
  const status = m.status[pace.status];
  // The scale runs a little past the target, so a goal beaten by a margin still shows it.
  const max = Math.max(target * 1.2, value, 1);
  const share = target === 0 ? 0 : value / target;
  const facts: { term: string; detail: ReactNode; note?: string | undefined }[] = [
    {
      term: m.projected,
      detail: pace.projected === null ? '' : write(pace.projected),
      note:
        pace.projected === null || target === 0
          ? undefined
          : m.projectedShare(percent(pace.projected / target)),
    },
    { term: m.daysLeft, detail: m.days(pace.daysLeft) },
    {
      term: m.neededPerDay,
      detail: pace.neededPerDay === null ? m.nothingNeeded : write(pace.neededPerDay),
    },
  ];

  return (
    <ChartCard
      {...card}
      title={label}
      loading={loading}
      {...(loading === true
        ? {}
        : {
            value: money ? (
              <span className="font-(family-name:--rx-money-family)">{write(value)}</span>
            ) : (
              write(value)
            ),
            delta: <Badge tone={TONE[pace.status]}>{status}</Badge>,
          })}
    >
      <div
        className={cn(
          'flex flex-col gap-5',
          variant === 'gauge' && '@lg:flex-row @lg:items-center @lg:gap-8',
        )}
      >
        {variant === 'gauge' ? (
          <RadialGauge
            label={label}
            value={value}
            max={max}
            target={target}
            marker={{
              value: format === 'percent' ? pace.expected : Math.round(pace.expected),
              label: m.pace,
            }}
            format={format}
            currency={currency}
            locale={locale}
            loading={loading}
            centerValue={formatValue(value, format, { locale, currency, compact: true })}
            centerLabel={target === 0 ? undefined : m.ofTarget(percent(share))}
            messages={{ target: m.target }}
            sizeClassName="w-48"
            className="@lg:flex-1"
          />
        ) : (
          <GoalBar
            label={label}
            value={value}
            max={max}
            target={target}
            expected={pace.expected}
            valueText={m.summary({ label, value: write(value), target: write(target), status })}
            legend={[`${m.target} ${write(target)}`, `${m.pace} ${write(pace.expected)}`]}
          />
        )}
        <dl
          data-slot="goal-facts"
          className={cn(
            'grid grid-cols-3 gap-4 border-t border-line pt-4',
            variant === 'gauge' &&
              '@lg:w-56 @lg:grid-cols-1 @lg:border-t-0 @lg:border-s @lg:ps-6 @lg:pt-0',
          )}
        >
          {facts.map((fact) => (
            <div key={fact.term} className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-xs text-fg-muted">{fact.term}</dt>
              <dd className="text-sm font-medium text-fg numeric">
                {fact.detail}
                {fact.note !== undefined && (
                  <span className="block text-xs font-normal text-fg-muted">{fact.note}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </ChartCard>
  );
}

/** The straight variant: a track filled to the value, the target as a solid tick, pace dashed. */
function GoalBar({
  label,
  value,
  max,
  target,
  expected,
  valueText,
  legend,
}: {
  label: string;
  value: number;
  max: number;
  target: number;
  expected: number;
  valueText: string;
  legend: [string, string];
}) {
  const glide = useMarkGlide();
  const at = (figure: number) => `${String(Math.min(100, Math.max(0, (figure / max) * 100)))}%`;
  return (
    <div className="flex flex-col gap-2">
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        className="relative h-3 rounded-full bg-chart-grid"
      >
        <div
          className={cn('absolute inset-y-0 start-0 rounded-full bg-chart-series-1', glide)}
          style={{ width: at(value) }}
        />
        <div
          aria-hidden
          className="absolute -inset-y-1.5 w-0 border-s-2 border-dashed border-fg-muted"
          style={{ insetInlineStart: at(expected) }}
        />
        <div
          aria-hidden
          className="absolute -inset-y-2 w-0.5 -translate-x-1/2 rounded-full bg-fg ring-2 ring-chart-halo rtl:translate-x-1/2"
          style={{ insetInlineStart: at(target) }}
        />
      </div>
      <ul
        aria-hidden
        className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-fg-muted numeric"
      >
        <li className="inline-flex items-center gap-1.5">
          <span className="h-3 w-0.5 rounded-full bg-fg" />
          {legend[0]}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="h-3 w-0 border-s-2 border-dashed border-fg-muted" />
          {legend[1]}
        </li>
      </ul>
    </div>
  );
}

import { Meter as BaseMeter } from '@base-ui/react/meter';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';
import { RING_TONE, ringMotion } from '../progress-circle/progress-circle';
import {
  PROGRESS_FILL,
  progressFillMotion,
  progressShare,
  type ProgressTone,
} from '../progress/progress';

export interface MeterThresholds {
  /** From this value up the meter reads as a warning. */
  warning?: number | undefined;
  /** From this value up the meter reads as critical. */
  critical?: number | undefined;
  /**
   * `high` (default) when more is worse, such as storage used; `low` when less is worse, such as a
   * health score, so the thresholds count downward.
   */
  worse?: 'high' | 'low' | undefined;
}

export type MeterLevel = 'normal' | 'warning' | 'critical';

const LEVEL_TONE: Record<MeterLevel, ProgressTone> = {
  normal: 'accent',
  warning: 'warning',
  critical: 'negative',
};

const LEVEL_TEXT: Record<MeterLevel, string> = {
  normal: 'text-fg-muted',
  warning: 'text-warning-strong',
  critical: 'text-negative-strong',
};

/** Where a value sits against its thresholds. */
export function meterLevel(value: number, thresholds: MeterThresholds = {}): MeterLevel {
  const { warning, critical, worse = 'high' } = thresholds;
  const past = (limit: number | undefined) =>
    limit !== undefined && (worse === 'high' ? value >= limit : value <= limit);
  if (past(critical)) return 'critical';
  if (past(warning)) return 'warning';
  return 'normal';
}

/**
 * The gauge's arc: a half circle from the left end through the top to the right, measured as 100.
 * Drawn in a 100 by 56 box so the stroke's round caps fit.
 */
const ARC = 'M 8 50 A 42 42 0 0 1 92 50';

/** A point on the arc for a share of the range (0 is the left end), for threshold ticks. */
function arcPoint(share: number, radius: number) {
  const angle = Math.PI * (1 - share);
  return { x: 50 + radius * Math.cos(angle), y: 50 - radius * Math.sin(angle) };
}

export type MeterProps = Omit<ComponentProps<typeof BaseMeter.Root>, 'className' | 'children'> & {
  className?: string | undefined;
  /** What is measured: `Storage used`. Names the meter. */
  label: ReactNode;
  /** `gauge`, a half ring with the figure inside; `bar`, a line with the figure beside the label. */
  variant?: 'gauge' | 'bar' | undefined;
  thresholds?: MeterThresholds | undefined;
  /** Overrides the tone the thresholds pick. */
  tone?: ProgressTone | undefined;
  /**
   * Words for the level, shown under the figure and read with it, so the state never rests on
   * colour: `{ warning: 'Nearly full', critical: 'Full' }`.
   */
  levelLabels?: Partial<Record<MeterLevel, string>> | undefined;
  /** Small print under the meter, such as `46.2 of 50 GB`. */
  description?: ReactNode | undefined;
};

/**
 * A measurement inside a known range, such as storage used, a budget spent or a score. Not for
 * work that finishes: that is Progress. Thresholds turn it to warning and critical and are marked
 * on the scale.
 */
export function Meter({
  value,
  min = 0,
  max = 100,
  label,
  variant = 'gauge',
  thresholds,
  tone,
  levelLabels,
  description,
  getAriaValueText,
  className,
  ...props
}: MeterProps) {
  const share = progressShare(value, min, max);
  const level = meterLevel(value, thresholds);
  const resolved = tone ?? LEVEL_TONE[level];
  const words = levelLabels?.[level];
  const ticks = [thresholds?.warning, thresholds?.critical]
    .filter((t): t is number => t !== undefined)
    .map((t) => progressShare(t, min, max));
  return (
    <BaseMeter.Root
      value={value}
      min={min}
      max={max}
      data-slot="meter"
      data-variant={variant}
      data-level={level}
      getAriaValueText={(formatted, raw) => {
        const text = getAriaValueText ? getAriaValueText(formatted, raw) : formatted;
        return words === undefined ? text : `${text}, ${words}`;
      }}
      className={cn(
        'flex flex-col gap-1.5',
        variant === 'gauge' ? 'w-44 items-center text-center' : 'w-full',
        className,
      )}
      {...props}
    >
      {variant === 'gauge' ? (
        <>
          <span className="relative w-full">
            <svg aria-hidden viewBox="0 0 100 56" fill="none" className="w-full overflow-visible">
              <path
                d={ARC}
                pathLength={100}
                strokeWidth={8}
                strokeLinecap="round"
                className="stroke-surface-sunken"
              />
              <path
                d={ARC}
                pathLength={100}
                strokeWidth={8}
                strokeLinecap="round"
                stroke="currentColor"
                strokeDasharray={`${String(share * 100)} 100`}
                strokeOpacity={share === 0 ? 0 : 1}
                className={cn(RING_TONE[resolved], ringMotion)}
              />
              {ticks.map((t) => {
                const inner = arcPoint(t, 34);
                const outer = arcPoint(t, 50);
                return (
                  <line
                    key={t}
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    strokeWidth={1.5}
                    className="stroke-fg-subtle"
                  />
                );
              })}
            </svg>
            <span className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <BaseMeter.Value className="text-2xl font-strong tracking-tight text-fg numeric" />
            </span>
          </span>
          {words !== undefined && (
            <span aria-hidden className={cn('text-xs font-medium', LEVEL_TEXT[level])}>
              {words}
            </span>
          )}
          <BaseMeter.Label className="text-sm text-fg-muted">{label}</BaseMeter.Label>
        </>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <BaseMeter.Label className="font-medium text-fg">{label}</BaseMeter.Label>
            <span className="flex items-baseline gap-2">
              {words !== undefined && (
                <span aria-hidden className={cn('text-xs font-medium', LEVEL_TEXT[level])}>
                  {words}
                </span>
              )}
              <BaseMeter.Value className="text-fg-muted numeric" />
            </span>
          </div>
          <BaseMeter.Track className="relative h-2 w-full rounded-full bg-surface-sunken">
            <span className="absolute inset-0 overflow-hidden rounded-full">
              <span
                className={cn(
                  'absolute inset-0 rounded-full ltr:origin-left rtl:origin-right',
                  progressFillMotion,
                  PROGRESS_FILL[resolved],
                )}
                style={{ transform: `scaleX(${String(share)})` }}
              />
            </span>
            {ticks.map((t) => (
              <span
                key={t}
                aria-hidden
                className="absolute -inset-y-1 w-px bg-fg-subtle"
                style={{ insetInlineStart: `${String(t * 100)}%` }}
              />
            ))}
          </BaseMeter.Track>
        </>
      )}
      {description !== undefined && <p className="text-xs text-fg-muted">{description}</p>}
    </BaseMeter.Root>
  );
}

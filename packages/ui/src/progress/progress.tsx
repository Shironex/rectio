import { Progress as BaseProgress } from '@base-ui/react/progress';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';

export type ProgressTone = 'accent' | 'positive' | 'warning' | 'negative';
export type ProgressSize = 'sm' | 'md' | 'lg';

export const PROGRESS_FILL: Record<ProgressTone, string> = {
  accent: 'bg-accent',
  positive: 'bg-positive',
  warning: 'bg-warning',
  negative: 'bg-negative',
};

const HEIGHTS: Record<ProgressSize, string> = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' };

/** The share done, from 0 to 1, whatever the range. */
export function progressShare(value: number, min = 0, max = 100): number {
  if (max <= min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * The fill scales instead of changing its width, so a moving value never lays the page out again.
 * The transition starts fast and settles, retargeting from wherever it is when the value changes.
 */
export const progressFillMotion =
  'transition-transform duration-slow ease-enter motion-reduce:transition-none';

export type ProgressProps = Omit<
  ComponentProps<typeof BaseProgress.Root>,
  'className' | 'children'
> & {
  className?: string | undefined;
  /** What is progressing: `Uploading statements`. Shown above the bar and names it. */
  label?: ReactNode | undefined;
  /** Show the value (`64%`, or as `format` says) at the end of the label row. */
  showValue?: boolean | undefined;
  /** Extra words under the bar, such as `12 of 19 files`. */
  description?: ReactNode | undefined;
  size?: ProgressSize | undefined;
  tone?: ProgressTone | undefined;
  /** Split the track into this many segments, for steps of a flow or a quota in units. */
  segments?: number | undefined;
};

/**
 * How far a task has got. `value={null}` for a task whose length is not known yet: a short band
 * travels along the track (under reduced motion, the track breathes in place).
 */
export function Progress({
  value,
  min = 0,
  max = 100,
  label,
  showValue = false,
  description,
  size = 'md',
  tone = 'accent',
  segments,
  className,
  ...props
}: ProgressProps) {
  const share = value === null ? null : progressShare(value, min, max);
  const count = segments !== undefined && segments > 1 ? Math.round(segments) : null;
  return (
    <BaseProgress.Root
      value={value}
      min={min}
      max={max}
      data-slot="progress"
      data-tone={tone}
      className={cn('flex w-full flex-col gap-1.5', className)}
      {...props}
    >
      {(label !== undefined || showValue) && (
        <div className="flex items-baseline justify-between gap-3 text-sm">
          {label !== undefined && (
            <BaseProgress.Label className="font-medium text-fg">{label}</BaseProgress.Label>
          )}
          {showValue && value !== null && (
            <BaseProgress.Value className="ms-auto text-fg-muted numeric" />
          )}
        </div>
      )}
      {count === null ? (
        <BaseProgress.Track
          className={cn(
            'relative w-full overflow-hidden rounded-full bg-surface-sunken',
            HEIGHTS[size],
          )}
        >
          {share === null ? (
            <span
              data-slot="progress-indeterminate"
              className={cn(
                'absolute inset-y-0 start-0 w-2/5 rounded-full animate-indeterminate',
                'motion-reduce:w-full motion-reduce:animate-breathe motion-reduce:opacity-60',
                PROGRESS_FILL[tone],
              )}
            />
          ) : (
            <span
              data-slot="progress-fill"
              data-part="fill"
              className={cn(
                'absolute inset-0 rounded-full ltr:origin-left rtl:origin-right',
                progressFillMotion,
                PROGRESS_FILL[tone],
              )}
              style={{ transform: `scaleX(${String(share)})` }}
            />
          )}
        </BaseProgress.Track>
      ) : (
        <BaseProgress.Track className={cn('flex w-full gap-1', HEIGHTS[size])}>
          {Array.from({ length: count }, (_, i) => {
            // Each segment fills by its own share, so a value between steps shows a part-filled one.
            const part = share === null ? 0 : Math.min(1, Math.max(0, share * count - i));
            return (
              <span
                key={i}
                data-slot="progress-segment"
                data-filled={part === 1 || undefined}
                className="relative flex-1 overflow-hidden rounded-full bg-surface-sunken"
              >
                <span
                  data-part="fill"
                  className={cn(
                    'absolute inset-0 rounded-full ltr:origin-left rtl:origin-right',
                    progressFillMotion,
                    share === null && 'animate-breathe',
                    PROGRESS_FILL[tone],
                  )}
                  style={{
                    transform: `scaleX(${String(share === null ? 1 : part)})`,
                    opacity: share === null ? 0.35 : undefined,
                    animationDelay:
                      share === null
                        ? `calc(var(--rx-motion-duration-stagger) * ${String(i * 2)})`
                        : undefined,
                  }}
                />
              </span>
            );
          })}
        </BaseProgress.Track>
      )}
      {description !== undefined && <p className="text-xs text-fg-muted">{description}</p>}
    </BaseProgress.Root>
  );
}

import { Progress as BaseProgress } from '@base-ui/react/progress';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';
import { progressShare, type ProgressTone } from '../progress/progress';

export type ProgressCircleSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<ProgressCircleSize, string> = {
  sm: 'size-6',
  md: 'size-12',
  lg: 'size-20',
  xl: 'size-28',
};

/** The figure in the middle, scaled to the ring. The small ring has no room for one. */
const FIGURE: Record<ProgressCircleSize, string> = {
  sm: 'hidden',
  md: 'text-xs',
  lg: 'text-lg',
  xl: 'text-2xl',
};

/** Stroke width in the 40-unit drawing, thicker on the small ring so it stays legible. */
const STROKE: Record<ProgressCircleSize, number> = { sm: 5, md: 4, lg: 3.5, xl: 3 };

export const RING_TONE: Record<ProgressTone, string> = {
  accent: 'text-accent',
  positive: 'text-positive',
  warning: 'text-warning',
  negative: 'text-negative',
};

/**
 * The arc's length follows the value: `stroke-dasharray` on a path measured as 100. It transitions
 * fast out and settles, from wherever it is.
 */
export const ringMotion =
  'transition-[stroke-dasharray] duration-slow ease-enter motion-reduce:transition-none';

export type ProgressCircleProps = Omit<
  ComponentProps<typeof BaseProgress.Root>,
  'className' | 'children'
> & {
  className?: string | undefined;
  size?: ProgressCircleSize | undefined;
  tone?: ProgressTone | undefined;
  /** Names the ring for assistive technology, and shows under it when `showLabel` is set. */
  label: string;
  showLabel?: boolean | undefined;
  /** Replaces the percentage in the middle, such as `3/5`. */
  children?: ReactNode | undefined;
};

/**
 * Progress as a ring: compact, for a card corner, a row or a step. `value={null}` spins a short
 * arc for work of unknown length.
 */
export function ProgressCircle({
  value,
  min = 0,
  max = 100,
  size = 'md',
  tone = 'accent',
  label,
  showLabel = false,
  className,
  children,
  ...props
}: ProgressCircleProps) {
  const share = value === null ? null : progressShare(value, min, max);
  const stroke = STROKE[size];
  const r = 20 - stroke / 2;
  return (
    <BaseProgress.Root
      value={value}
      min={min}
      max={max}
      aria-label={label}
      data-slot="progress-circle"
      className={cn('inline-flex flex-col items-center gap-2', className)}
      {...props}
    >
      <span className={cn('relative inline-flex shrink-0', SIZES[size])}>
        <svg
          aria-hidden
          viewBox="0 0 40 40"
          fill="none"
          className={cn(
            'size-full -rotate-90',
            share === null && 'animate-spin motion-reduce:animate-breathe',
          )}
        >
          <circle
            cx="20"
            cy="20"
            r={r}
            strokeWidth={stroke}
            className="stroke-surface-placeholder"
          />
          <circle
            cx="20"
            cy="20"
            r={r}
            strokeWidth={stroke}
            stroke="currentColor"
            strokeLinecap="round"
            data-part="arc"
            pathLength={100}
            strokeDasharray={share === null ? '28 100' : `${String(share * 100)} 100`}
            // A zero value draws nothing rather than a round dot of the line cap.
            strokeOpacity={share === 0 ? 0 : 1}
            className={cn(RING_TONE[tone], ringMotion)}
          />
        </svg>
        {share !== null && (
          <span
            aria-hidden
            data-part="figure"
            className={cn(
              'absolute inset-0 flex items-center justify-center font-medium tracking-tight text-fg numeric',
              FIGURE[size],
            )}
          >
            {children ?? <BaseProgress.Value />}
          </span>
        )}
      </span>
      {showLabel && <span className="text-sm text-fg-muted">{label}</span>}
    </BaseProgress.Root>
  );
}

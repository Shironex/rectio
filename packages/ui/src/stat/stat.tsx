import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon } from '@phosphor-icons/react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';

export interface StatChange {
  /** The change as shown: `12%`, `+340`, `2 days`. */
  value: ReactNode;
  direction: 'up' | 'down' | 'flat';
  /**
   * Whether this direction is good news. Signups up is good; churn up is bad. Sets the colour; the
   * arrow and the words say the direction either way. Leave it out for a change that is neither.
   */
  favourable?: boolean | undefined;
  /** What it is compared with: `vs last week`. */
  comparison?: ReactNode | undefined;
}

const ARROWS = { up: ArrowUpRightIcon, down: ArrowDownRightIcon, flat: ArrowRightIcon };
const SPOKEN = { up: 'up', down: 'down', flat: 'no change' };

export interface StatProps extends ComponentProps<'div'> {
  /** What the figure is: `Active users`. */
  label: ReactNode;
  /** The figure, formatted: `4,182`. Rendered in tabular figures. */
  value: ReactNode;
  /** A unit or a small suffix after the figure: `ms`, `/ month`. */
  unit?: ReactNode | undefined;
  change?: StatChange | undefined;
  /** A line of context under the figure. */
  description?: ReactNode | undefined;
  /** An icon beside the label. */
  icon?: ReactNode | undefined;
  /** A small chart or meter at the end, such as a sparkline. Decorative: say it in words too. */
  trend?: ReactNode | undefined;
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** `card` frames the tile; `plain` sits on its surface, for a row inside a StatGroup or panel. */
  variant?: 'plain' | 'card' | undefined;
}

const FIGURE = { sm: 'text-xl', md: 'text-2xl', lg: 'text-4xl' } as const;

/**
 * One figure with its label and how it moved: active users, response time, open tickets. A
 * description list, so the label and the figure are read as a pair.
 */
export function Stat({
  label,
  value,
  unit,
  change,
  description,
  icon,
  trend,
  size = 'md',
  variant = 'plain',
  className,
  ...props
}: StatProps) {
  const Arrow = change === undefined ? null : ARROWS[change.direction];
  const changeTone =
    change?.favourable === undefined
      ? 'text-fg-muted'
      : change.favourable
        ? 'text-positive-strong'
        : 'text-negative-strong';
  return (
    <div
      data-slot="stat"
      className={cn(
        'flex min-w-0 flex-col',
        variant === 'card' && 'rounded-panel border border-line bg-surface px-5 py-4',
        className,
      )}
      {...props}
    >
      <dl className="flex min-w-0 flex-col gap-1.5">
        <dt className="flex items-center gap-1.5 text-sm text-fg-muted [&_svg]:size-4 [&_svg]:text-fg-subtle">
          {icon}
          {label}
        </dt>
        <dd className="flex items-end justify-between gap-4">
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex items-baseline gap-1">
              <span className={cn('font-strong tracking-tight text-fg numeric', FIGURE[size])}>
                {value}
              </span>
              {unit !== undefined && <span className="text-sm text-fg-muted">{unit}</span>}
            </span>
            {change !== undefined && Arrow !== null && (
              <span className="flex flex-wrap items-center gap-x-1.5 text-sm">
                <span className={cn('inline-flex items-center gap-0.5 font-medium', changeTone)}>
                  <Arrow aria-hidden weight="bold" className="size-3.5" />
                  <span className="sr-only">{SPOKEN[change.direction]} </span>
                  <span className="numeric">{change.value}</span>
                </span>
                {change.comparison !== undefined && (
                  <span className="text-fg-muted">{change.comparison}</span>
                )}
              </span>
            )}
          </span>
          {trend !== undefined && (
            <span aria-hidden className="flex shrink-0">
              {trend}
            </span>
          )}
        </dd>
        {description !== undefined && <dd className="text-xs text-fg-subtle">{description}</dd>}
      </dl>
    </div>
  );
}

/**
 * A row of stats sharing one frame, divided by hairlines. Wraps to two columns, then one, by its
 * own width, so it fits a full row or half a dashboard.
 */
export function StatGroup({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="stat-group" className={cn('@container', className)} {...props}>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-panel border border-line bg-line @md:grid-cols-2 @4xl:grid-cols-4 [&>*]:bg-surface [&>*]:px-5 [&>*]:py-4">
        {children}
      </div>
    </div>
  );
}

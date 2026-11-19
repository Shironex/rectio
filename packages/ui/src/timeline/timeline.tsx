import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';

export type TimelineTone = 'neutral' | 'accent' | 'positive' | 'warning' | 'negative';

const DOT: Record<TimelineTone, string> = {
  neutral: 'bg-surface border-2 border-line-strong',
  accent: 'bg-accent',
  positive: 'bg-positive',
  warning: 'bg-warning',
  negative: 'bg-negative',
};

const TILE: Record<TimelineTone, string> = {
  neutral: 'border-line bg-surface-sunken text-fg-subtle',
  accent: 'border-accent-strong/20 bg-accent-subtle text-accent-strong',
  positive: 'border-positive-strong/20 bg-positive-subtle text-positive-strong',
  warning: 'border-warning-strong/20 bg-warning-subtle text-warning-strong',
  negative: 'border-negative-strong/20 bg-negative-subtle text-negative-strong',
};

export interface TimelineProps extends ComponentProps<'ol'> {
  /** `compact` tightens the rhythm for a side panel or an activity feed. */
  density?: 'comfortable' | 'compact' | undefined;
}

/**
 * Events in order: an audit trail, the history of a record, an activity feed. An ordered list, so
 * assistive technology says how many events there are and where each one sits.
 */
export function Timeline({ density = 'comfortable', className, ...props }: TimelineProps) {
  return (
    <ol
      data-slot="timeline"
      data-density={density}
      className={cn('group/timeline flex flex-col', className)}
      {...props}
    />
  );
}

export interface TimelineItemProps extends Omit<ComponentProps<'li'>, 'title'> {
  /** What happened: `Ana Ruiz approved the invoice`. */
  title: ReactNode;
  /** When, as a `Date` or ISO string for the `time` element, with the words to show. */
  time?: { dateTime: string; label: ReactNode };
  /** An icon, drawn in a tile tinted by `tone`. */
  icon?: ReactNode | undefined;
  /** Any marker of your own in place of the dot or icon, such as an Avatar of size `sm`. */
  marker?: ReactNode | undefined;
  tone?: TimelineTone | undefined;
  /** Extra detail under the title: a note, a quoted reason, an attachment. */
  children?: ReactNode | undefined;
}

export function TimelineItem({
  title,
  time,
  icon,
  marker,
  tone = 'neutral',
  className,
  children,
  ...props
}: TimelineItemProps) {
  const tile = icon !== undefined || marker !== undefined;
  return (
    <li
      data-slot="timeline-item"
      data-tone={tone}
      className={cn(
        'group/item relative flex gap-x-3',
        'pb-6 last:pb-0 in-data-[density=compact]:pb-4 in-data-[density=compact]:last:pb-0',
        className,
      )}
      {...props}
    >
      {/* The rail: from under this marker to the next one; the last item has none. */}
      <span
        aria-hidden
        className={cn(
          'absolute bottom-0 w-px bg-line group-last/item:hidden',
          tile ? 'start-3.5 top-8' : 'start-1.5 top-4',
        )}
      />
      <span
        aria-hidden
        className={cn('relative flex shrink-0 justify-center', tile ? 'w-7' : 'w-3 pt-1.5')}
      >
        {marker ??
          (icon !== undefined ? (
            <span
              className={cn(
                'flex size-7 items-center justify-center rounded-full border [&_svg]:size-3.5',
                TILE[tone],
              )}
            >
              {icon}
            </span>
          ) : undefined)}
        {!tile && <span className={cn('size-3 rounded-full ring-4 ring-surface', DOT[tone])} />}
      </span>
      <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5', tile && 'pt-1')}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="min-w-0 text-sm text-fg">{title}</p>
          {time !== undefined && (
            <time
              dateTime={time.dateTime}
              className="text-xs whitespace-nowrap text-fg-subtle numeric"
            >
              {time.label}
            </time>
          )}
        </div>
        {children !== undefined && <div className="text-sm text-fg-muted">{children}</div>}
      </div>
    </li>
  );
}

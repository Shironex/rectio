import {
  ChatCircleTextIcon,
  CreditCardIcon,
  PencilSimpleIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserPlusIcon,
  type Icon,
} from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useState } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { resolveLocale } from '../../lib/finance';
import { Segmented } from '../../lib/segmented';
import { Avatar } from '../lib/avatar';
import { formatDateTime, relativeTime } from '../lib/saas';
import { useSaasParts } from '../lib/saas-parts';
import {
  ACTIVITY_FILTER_LABELS,
  activityFilterCounts,
  activityMatches,
  groupActivityByDay,
  type ActivityEvent,
  type ActivityFilter,
  type ActivityKind,
} from './activity-feed.logic';

export interface ActivityFeedProps {
  events: readonly ActivityEvent[];
  /** Shows the filter row: comments, changes, people and account. */
  filterable?: boolean;
  /** Offers "Show older activity" when there is more to fetch. */
  hasMore?: boolean | undefined;
  /** The older page is loading: the button shows progress. */
  loadingMore?: boolean | undefined;
  onLoadMore?: (() => void) | undefined;
  /** The moment relative times and "Today" are measured from. */
  now?: Date;
  locale?: string;
  title?: string;
  className?: string;
}

const KIND_ICONS: Record<ActivityKind, Icon> = {
  comment: ChatCircleTextIcon,
  create: PlusIcon,
  update: PencilSimpleIcon,
  delete: TrashIcon,
  member: UserPlusIcon,
  billing: CreditCardIcon,
  security: ShieldCheckIcon,
};

/**
 * What happened in the workspace, newest first and grouped by day: who did what to which thing,
 * with the moment in words and the exact time on hover and for assistive technology. The block
 * holds only the filter; older pages come from your `onLoadMore`.
 */
export function ActivityFeed({
  events,
  filterable = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  now = new Date(),
  locale: requestedLocale,
  title = 'Activity',
  className,
}: ActivityFeedProps) {
  const locale = resolveLocale(requestedLocale);
  const { Button } = useBlockParts();
  const { Items, Item } = useSaasParts();
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const counts = activityFilterCounts(events);
  const shown = events.filter((event) => activityMatches(event, filter));
  const days = groupActivityByDay(shown, now, locale);
  const filters = (Object.keys(ACTIVITY_FILTER_LABELS) as ActivityFilter[]).filter(
    (value) => value === 'all' || value === filter || counts[value] > 0,
  );

  return (
    <BlockPanel
      title={title}
      description={events.length === 0 ? 'Nothing yet' : 'Newest first'}
      className={className}
      bodyClassName="gap-5"
    >
      {events.length === 0 ? (
        <EmptyNote title="No activity yet">
          Comments, changes and new members show up here as your team works.
        </EmptyNote>
      ) : (
        <>
          {filterable && filters.length > 2 && (
            <Segmented
              label="Show activity"
              value={filter}
              onValueChange={setFilter}
              options={filters.map((value) => ({
                value,
                label: ACTIVITY_FILTER_LABELS[value],
                hint: counts[value],
              }))}
            />
          )}
          {days.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">
              No {ACTIVITY_FILTER_LABELS[filter].toLowerCase()} in this stretch of activity.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {days.map((day) => (
                <section key={day.key} aria-label={day.label} className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-fg-muted first-letter:uppercase">
                    {day.label}
                  </h3>
                  <ol className="flex flex-col">
                    <Items>
                      {day.events.map((event, index) => (
                        <Item key={event.id} className="relative flex gap-3 py-2.5">
                          {/* The thread that joins one day's events, behind the avatars. */}
                          {index < day.events.length - 1 && (
                            <span
                              aria-hidden
                              className="absolute start-4 top-11 -bottom-2 w-px -translate-x-1/2 bg-line rtl:translate-x-1/2"
                            />
                          )}
                          <EventMark event={event} />
                          <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                              <p className="min-w-0 text-pretty">
                                <span className="font-medium">{event.actor.name}</span>{' '}
                                <span className="text-fg-muted">{event.verb}</span>
                                {event.target !== undefined && (
                                  <>
                                    {' '}
                                    <span className="font-medium">{event.target}</span>
                                  </>
                                )}
                              </p>
                              <time
                                dateTime={event.at.toISOString()}
                                title={formatDateTime(event.at, locale)}
                                className="shrink-0 text-sm text-fg-subtle"
                              >
                                {relativeTime(event.at, now, locale)}
                                <span className="sr-only">
                                  , {formatDateTime(event.at, locale)}
                                </span>
                              </time>
                            </div>
                            {event.detail !== undefined && (
                              <p
                                className={cn(
                                  'text-sm text-pretty',
                                  event.kind === 'comment'
                                    ? 'rounded-control border border-line bg-surface-sunken px-3 py-2 text-fg'
                                    : 'text-fg-muted',
                                )}
                              >
                                {event.detail}
                              </p>
                            )}
                          </div>
                        </Item>
                      ))}
                    </Items>
                  </ol>
                </section>
              ))}
            </div>
          )}
          {hasMore && onLoadMore !== undefined && (
            <Button
              variant="secondary"
              loading={loadingMore}
              onClick={onLoadMore}
              className="self-center"
            >
              Show older activity
            </Button>
          )}
        </>
      )}
    </BlockPanel>
  );
}

/** The actor's avatar with the event's kind as a small icon on its corner. */
function EventMark({ event }: { event: ActivityEvent }) {
  const KindIcon = KIND_ICONS[event.kind];
  return (
    <span className="relative inline-flex size-8 shrink-0">
      <Avatar name={event.actor.name} src={event.actor.avatarUrl} />
      <span
        aria-hidden
        className={cn(
          'absolute -end-1.5 -bottom-1.5 inline-flex size-4 items-center justify-center rounded-full ring-2 ring-surface',
          event.kind === 'delete' || event.kind === 'security'
            ? 'bg-surface-raised text-negative-strong'
            : 'bg-surface-raised text-fg-muted',
        )}
      >
        <KindIcon weight="bold" className="size-3" />
      </span>
    </span>
  );
}

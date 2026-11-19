import {
  ChatCircleTextIcon,
  CreditCardIcon,
  PencilSimpleIcon,
  PlusIcon,
  PulseIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserPlusIcon,
  type Icon,
} from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useId, useState } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { ChoiceSelect } from '../../lib/choice-select';
import { EmptyNote } from '../../lib/empty-note';
import { resolveLocale } from '../../lib/finance';
import { Segmented } from '../../lib/segmented';
import { Avatar } from '../lib/avatar';
import { useNow } from '../lib/focus';
import { dateFormat, formatDateTime, isoDateTime, relativeTime, sameDay } from '../lib/saas';
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
  /** Offers "Invite your team" on the empty feed. */
  onInvite?: (() => void) | undefined;
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
  onInvite,
  now: requestedNow,
  locale: requestedLocale,
  title = 'Activity',
  className,
}: ActivityFeedProps) {
  const locale = resolveLocale(requestedLocale);
  const now = useNow(requestedNow);
  const idPrefix = useId();
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
      description={events.length === 0 ? 'Who did what, and when' : 'Newest first'}
      className={className}
      bodyClassName="gap-5"
    >
      {events.length === 0 ? (
        <EmptyNote
          title={
            <span className="flex flex-col items-center gap-3">
              <PulseIcon aria-hidden weight="duotone" className="size-8 text-fg-subtle" />
              No activity yet
            </span>
          }
        >
          Comments, changes and new members appear here as your team works.
          {onInvite !== undefined && (
            <span className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={onInvite}>
                <UserPlusIcon aria-hidden weight="bold" className="size-4" />
                Invite your team
              </Button>
            </span>
          )}
        </EmptyNote>
      ) : (
        <>
          {filterable && filters.length > 2 && (
            <>
              <Segmented
                label="Show activity"
                value={filter}
                onValueChange={setFilter}
                className="hidden @lg:flex"
                options={filters.map((value) => ({
                  value,
                  label: ACTIVITY_FILTER_LABELS[value],
                  hint: counts[value],
                }))}
              />
              {/* Narrow: one select instead of a filter row that wraps. */}
              <ChoiceSelect
                label="Show"
                value={filter}
                onValueChange={setFilter}
                className="w-full @lg:hidden"
                choices={filters.map((value) => ({
                  value,
                  label: `${ACTIVITY_FILTER_LABELS[value]} (${String(counts[value])})`,
                }))}
              />
            </>
          )}
          {days.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">
              No {ACTIVITY_FILTER_LABELS[filter].toLowerCase()} in this stretch of activity.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {days.map((day) => (
                <div key={day.key} className="flex flex-col gap-1">
                  {/* A heading per day, not a landmark: the list is named by it. */}
                  <h3
                    id={`${idPrefix}-${day.key}`}
                    className="text-sm font-medium text-fg-muted first-letter:uppercase"
                  >
                    {day.label}
                  </h3>
                  <ol aria-labelledby={`${idPrefix}-${day.key}`} className="flex flex-col">
                    <Items>
                      {day.events.map((event, index) => (
                        <Item key={event.id} className="relative flex gap-3 py-2.5">
                          <Thread index={index} count={day.events.length} />
                          <EventMark event={event} />
                          <EventText
                            event={event}
                            now={now}
                            locale={locale}
                            today={sameDay(event.at, now)}
                          />
                        </Item>
                      ))}
                    </Items>
                  </ol>
                </div>
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

/**
 * One day's thread behind the avatars: from the first avatar's centre to the last one's, drawn
 * as one segment per row so it never breaks between rows.
 */
function Thread({ index, count }: { index: number; count: number }) {
  if (count < 2) return null;
  const first = index === 0;
  const last = index === count - 1;
  return (
    <span
      aria-hidden
      className={cn(
        'absolute start-4 w-px -translate-x-1/2 bg-line-strong rtl:translate-x-1/2',
        first ? 'top-6.5 bottom-0' : 'top-0',
        last ? 'h-6.5' : 'bottom-0',
      )}
    />
  );
}

/**
 * A person is their avatar with the kind as a badge on its corner; the app itself is a smaller
 * node on the rail carrying the kind icon, so system events read apart from people's.
 */
function EventMark({ event }: { event: ActivityEvent }) {
  const KindIcon = KIND_ICONS[event.kind];
  if (event.actor.system === true) {
    return (
      <span
        aria-hidden
        className="relative inline-flex size-8 shrink-0 items-center justify-center"
      >
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-surface text-fg-muted ring-1 ring-line-strong">
          <KindIcon weight="bold" className="size-3.5" />
        </span>
      </span>
    );
  }
  return (
    <span className="relative inline-flex size-8 shrink-0">
      <Avatar name={event.actor.name} src={event.actor.avatarUrl} />
      <span
        aria-hidden
        className="absolute -end-2.5 -bottom-2.5 inline-flex size-5 items-center justify-center rounded-full bg-surface-raised text-fg ring-2 ring-surface"
      >
        <KindIcon weight="bold" className="size-3.5" />
      </span>
    </span>
  );
}

/**
 * The sentence, then the moment on its own muted meta line under it at every width. Today
 * reads in relative words; an earlier day shows the clock time under its date heading.
 */
function EventText({
  event,
  now,
  locale,
  today,
}: {
  event: ActivityEvent;
  now: Date;
  locale: string;
  today: boolean;
}) {
  const quoted = event.kind === 'comment' && event.detail !== undefined;
  const moment = today
    ? relativeTime(event.at, now, locale)
    : dateFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(event.at);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
      <p className="min-w-0 text-pretty">
        <span className="font-medium">{event.actor.name}</span>{' '}
        <span className="text-fg-muted">{event.verb}</span>
        {event.target !== undefined && (
          <>
            {' '}
            <span className="font-medium">{event.target}</span>
          </>
        )}
        {!quoted && event.detail !== undefined && (
          <span className="text-fg-muted">, {event.detail}</span>
        )}
        <time
          dateTime={isoDateTime(event.at)}
          title={formatDateTime(event.at, locale)}
          className="mt-0.5 block text-sm text-fg-muted numeric"
        >
          {moment}
          <span className="sr-only">, {formatDateTime(event.at, locale)}</span>
        </time>
      </p>
      {quoted && (
        <blockquote className="rounded-control border border-line bg-surface-sunken px-3 py-2 text-sm text-pretty text-fg">
          {event.detail}
        </blockquote>
      )}
    </div>
  );
}

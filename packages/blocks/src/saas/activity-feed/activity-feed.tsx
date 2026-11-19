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
import { useState } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { ChoiceSelect } from '../../lib/choice-select';
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
      description={events.length === 0 ? 'Who did what, and when' : 'Newest first'}
      className={className}
      bodyClassName="gap-5"
    >
      {events.length === 0 ? (
        <div
          role="status"
          className="flex flex-col items-center gap-3 rounded-control bg-surface-sunken px-6 py-10 text-center"
        >
          <span
            aria-hidden
            className="inline-flex size-10 items-center justify-center rounded-full bg-surface text-fg-muted ring-1 ring-line"
          >
            <PulseIcon weight="bold" className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-medium">No activity yet</p>
            <p className="max-w-sm text-sm text-pretty text-fg-muted">
              Invite your team or create a project: comments, changes and new members appear here as
              they happen.
            </p>
          </div>
        </div>
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
                <section key={day.key} aria-label={day.label} className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-fg-muted first-letter:uppercase">
                    {day.label}
                  </h3>
                  <ol className="flex flex-col">
                    <Items>
                      {day.events.map((event, index) => (
                        <Item key={event.id} className="relative flex gap-3 py-2.5">
                          <Thread index={index} count={day.events.length} />
                          <span className="relative">
                            <Avatar name={event.actor.name} src={event.actor.avatarUrl} />
                          </span>
                          <EventText event={event} now={now} locale={locale} />
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

/** The sentence, then its kind and time in a quiet tail; a comment quoted under it. */
function EventText({ event, now, locale }: { event: ActivityEvent; now: Date; locale: string }) {
  const KindIcon = KIND_ICONS[event.kind];
  const quoted = event.kind === 'comment' && event.detail !== undefined;
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
        <span className="ms-2 inline-flex items-baseline gap-1 text-sm whitespace-nowrap text-fg-subtle">
          <KindIcon
            aria-hidden
            weight="bold"
            className={cn(
              'size-3.5 self-center',
              (event.kind === 'delete' || event.kind === 'security') && 'text-negative-strong',
            )}
          />
          <time dateTime={event.at.toISOString()} title={formatDateTime(event.at, locale)}>
            {relativeTime(event.at, now, locale)}
            <span className="sr-only">, {formatDateTime(event.at, locale)}</span>
          </time>
        </span>
      </p>
      {quoted && (
        <blockquote className="rounded-control border border-line bg-surface-sunken px-3 py-2 text-sm text-pretty text-fg">
          {event.detail}
        </blockquote>
      )}
    </div>
  );
}

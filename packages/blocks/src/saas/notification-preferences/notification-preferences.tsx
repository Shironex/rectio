import { LockSimpleIcon } from '@phosphor-icons/react';
import { Checkbox, cn } from '@rectio/ui';
import { Fragment, useId } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import {
  groupNotificationEvents,
  notificationColumnState,
  notificationCount,
  notificationLocked,
  notificationOn,
  setNotification,
  setNotificationColumn,
  type NotificationChannel,
  type NotificationEvent,
  type NotificationGroup,
  type NotificationMatrix,
} from './notification-preferences.logic';

export interface NotificationPreferencesProps {
  channels: readonly NotificationChannel[];
  events: readonly NotificationEvent[];
  /** Which channels each event goes to. The block is controlled: pass back what `onChange` gives. */
  value: NotificationMatrix;
  /** Called with the whole new matrix on every change; save it as it comes or behind a button. */
  onChange: (value: NotificationMatrix) => void;
  /**
   * Offered while nothing beyond the required events is on, as a "Use recommended" button: set
   * your suggested matrix through `onChange` or your own state.
   */
  onUseRecommended?: () => void;
  /**
   * While you save: every control reads as unavailable and changes are ignored, but nothing is
   * disabled, so keyboard focus stays where it was.
   */
  disabled?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * What reaches people and where: each event against each channel, with a box per pair and one
 * per channel to turn a whole column on or off. Events a person must get (security alerts by
 * email) stay on and say why. On a narrow block each event becomes its own row of channels.
 */
export function NotificationPreferences({
  channels,
  events,
  value,
  onChange: onChangeProp,
  onUseRecommended,
  disabled = false,
  title = 'Notifications',
  description,
  className,
}: NotificationPreferencesProps) {
  const groups = groupNotificationEvents(events);
  const onChange = (next: NotificationMatrix) => {
    if (!disabled) onChangeProp(next);
  };
  const on = notificationCount(value, events, channels);
  const { Button } = useBlockParts();
  const lockedCount = events.reduce((sum, event) => sum + (event.required?.length ?? 0), 0);
  const anyLocked = lockedCount > 0;
  const uid = useId();
  /** Each layout draws its own "always on" note, so each gets its own id for the boxes to cite. */
  const lockId = (layout: 'wide' | 'narrow', eventId: string) => `${uid}-${layout}-${eventId}`;
  const untouched = on <= lockedCount;
  const allOn = on === events.length * channels.length;

  return (
    <BlockPanel
      title={title}
      description={
        description ??
        `${String(on)} of ${String(events.length * channels.length)} notifications on`
      }
      className={className}
      bodyClassName="gap-4"
    >
      {events.length === 0 || channels.length === 0 ? (
        <EmptyNote title="Nothing to set up yet">
          Each kind of notification appears here, with a box per channel, as soon as the workspace
          has something to tell you about.
        </EmptyNote>
      ) : (
        <>
          {untouched && onUseRecommended !== undefined && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line bg-surface-sunken px-4 py-3">
              <p className="text-sm">
                <span className="font-medium">Nothing chosen yet.</span>{' '}
                <span className="text-fg-muted">
                  {anyLocked ? 'Only the required alerts go out. ' : ''}Start from what most teams
                  use and adjust from there.
                </span>
              </p>
              <Button
                variant="secondary"
                size="sm"
                aria-disabled={disabled || undefined}
                onClick={() => {
                  if (!disabled) onUseRecommended();
                }}
              >
                Use recommended
              </Button>
            </div>
          )}
          {/* Wide: one matrix, events down, channels across. */}
          <table className="hidden w-full border-collapse text-sm @xl:table">
            <caption className="sr-only">Notifications by event and channel</caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="py-2 pe-4 text-start align-bottom font-medium text-fg-muted"
                >
                  Event
                </th>
                {channels.map((channel) => (
                  <th
                    key={channel.id}
                    scope="col"
                    className="w-28 px-2 py-2 text-center align-bottom font-medium"
                  >
                    {channel.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <th
                  scope="row"
                  className="pb-2.5 pe-4 text-start text-sm font-medium text-fg-muted"
                >
                  All events
                </th>
                {channels.map((channel) => {
                  const state = notificationColumnState(value, events, channel.id);
                  return (
                    <td key={channel.id} className="px-2 pb-2.5 text-center">
                      {/* A visible "All" under the box, so the column toggle is never bare. */}
                      <label className="inline-flex cursor-pointer flex-col items-center gap-1 text-xs text-fg-muted">
                        <Checkbox
                          aria-label={`All events by ${channel.label}`}
                          checked={state === 'all'}
                          indeterminate={state === 'some'}
                          aria-disabled={disabled || undefined}
                          onCheckedChange={(checked) => {
                            onChange(setNotificationColumn(value, events, channel.id, checked));
                          }}
                        />
                        All
                      </label>
                    </td>
                  );
                })}
              </tr>
              {groups.map((group) => (
                <Fragment key={group.name}>
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={channels.length + 1}
                      className="pt-5 pb-1.5 text-start text-xs font-medium tracking-caps text-fg-muted uppercase"
                    >
                      {group.name}
                      <GroupLockNote group={group} channels={channels} />
                    </th>
                  </tr>
                  {group.events.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-line transition-colors duration-fast ease-standard last:border-b-0 hover:bg-surface-sunken"
                    >
                      <th scope="row" className="py-3 pe-4 text-start font-regular">
                        <EventLabel
                          event={event}
                          channels={channels}
                          lockLabelId={lockId('wide', event.id)}
                        />
                        {event.description !== undefined && (
                          <span className="block text-fg-muted">{event.description}</span>
                        )}
                      </th>
                      {channels.map((channel) => (
                        <td key={channel.id} className="px-2 py-3 text-center">
                          <Cell
                            event={event}
                            channel={channel}
                            value={value}
                            disabled={disabled}
                            onChange={onChange}
                            lockLabelId={lockId('wide', event.id)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>

          {/* Narrow: each event, then its channels as labelled boxes. */}
          <div className="flex flex-col @xl:hidden">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-3 mb-4">
              <span className="text-sm font-medium">All notifications</span>
              <Button
                variant="secondary"
                size="sm"
                aria-disabled={disabled || undefined}
                onClick={() => {
                  onChange(
                    channels.reduce(
                      (next, channel) => setNotificationColumn(next, events, channel.id, !allOn),
                      value,
                    ),
                  );
                }}
              >
                {allOn ? 'Turn all off' : 'Turn all on'}
              </Button>
            </div>
            {groups.map((group) => (
              <section
                key={group.name}
                aria-label={group.name}
                className="flex flex-col pt-6 first:pt-0"
              >
                <h3 className="pb-1 text-xs font-medium tracking-caps text-fg-muted uppercase">
                  {group.name}
                </h3>
                <GroupLockNote group={group} channels={channels} />
                <ul className="flex flex-col">
                  {group.events.map((event) => (
                    <li
                      key={event.id}
                      className="flex flex-col gap-1 border-b border-line py-2.5 last:border-b-0"
                    >
                      <span className="flex flex-col text-sm">
                        <EventLabel
                          event={event}
                          channels={channels}
                          lockLabelId={lockId('narrow', event.id)}
                        />
                        {event.description !== undefined && (
                          <span className="text-fg-muted">{event.description}</span>
                        )}
                      </span>
                      <span
                        role="group"
                        aria-label={`Channels for ${event.label}`}
                        className="flex flex-wrap gap-x-6"
                      >
                        {channels.map((channel) => (
                          <label
                            key={channel.id}
                            className="flex min-h-(--rx-control-height-touch) cursor-pointer items-center gap-2.5 text-sm text-fg-muted"
                          >
                            <Cell
                              event={event}
                              channel={channel}
                              value={value}
                              disabled={disabled}
                              onChange={onChange}
                              lockLabelId={lockId('narrow', event.id)}
                              labelled
                            />
                            {channel.label}
                          </label>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </BlockPanel>
  );
}

/** One event on one channel. A required pair shows a lock beside a checked, disabled box. */
function Cell({
  event,
  channel,
  value,
  disabled,
  onChange,
  lockLabelId,
  labelled = false,
}: {
  event: NotificationEvent;
  channel: NotificationChannel;
  value: NotificationMatrix;
  disabled: boolean;
  onChange: (value: NotificationMatrix) => void;
  /** The "always on" note this box points to when locked. */
  lockLabelId: string;
  /** A visible label wraps the box, so it needs no name of its own. */
  labelled?: boolean;
}) {
  const locked = notificationLocked(event, channel.id);
  return (
    <span className={cn('inline-flex items-center', !labelled && 'justify-center')}>
      <Checkbox
        aria-label={labelled ? undefined : `${event.label} by ${channel.label}`}
        aria-describedby={locked ? lockLabelId : undefined}
        // A required box reads as on: a filled, muted tick rather than a pale disabled one.
        className={cn(
          locked &&
            'data-disabled:border-fg-muted data-disabled:bg-fg-muted data-disabled:text-surface',
        )}
        checked={notificationOn(value, event, channel.id)}
        disabled={locked}
        aria-disabled={disabled || locked || undefined}
        onCheckedChange={(checked) => {
          onChange(setNotification(value, event, channel.id, checked));
        }}
      />
    </span>
  );
}

/** The event's name, with a lock and the channels it always goes to when some are required. */
function EventLabel({
  event,
  channels,
  lockLabelId,
}: {
  event: NotificationEvent;
  channels: readonly NotificationChannel[];
  lockLabelId: string;
}) {
  const required = channels.filter((channel) => notificationLocked(event, channel.id));
  return (
    <span className="flex flex-wrap items-center gap-x-2 font-medium text-fg">
      {event.label}
      {required.length > 0 && (
        <span
          id={lockLabelId}
          className="inline-flex items-center gap-1 text-xs font-regular text-fg-muted"
        >
          <LockSimpleIcon aria-hidden weight="fill" className="size-3.5" />
          {required.map((channel) => channel.label).join(' and ')} always on
        </span>
      )}
    </span>
  );
}

/** Under a group with required events: which channels cannot be turned off, said once. */
function GroupLockNote({
  group,
  channels,
}: {
  group: NotificationGroup;
  channels: readonly NotificationChannel[];
}) {
  const locked = channels.filter((channel) =>
    group.events.some((event) => notificationLocked(event, channel.id)),
  );
  if (locked.length === 0) return null;
  return (
    <span className="mt-1 block text-sm font-regular tracking-normal text-fg-muted normal-case">
      {locked.map((channel) => channel.label).join(' and ')} for these cannot be turned off.
    </span>
  );
}

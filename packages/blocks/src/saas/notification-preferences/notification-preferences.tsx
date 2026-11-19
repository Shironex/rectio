import { LockSimpleIcon } from '@phosphor-icons/react';
import { Checkbox, cn } from '@rectio/ui';
import { Fragment, useId } from 'react';

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
  type NotificationMatrix,
} from './notification-preferences.logic';

export interface NotificationPreferencesProps {
  channels: readonly NotificationChannel[];
  events: readonly NotificationEvent[];
  /** Which channels each event goes to. The block is controlled: pass back what `onChange` gives. */
  value: NotificationMatrix;
  /** Called with the whole new matrix on every change; save it as it comes or behind a button. */
  onChange: (value: NotificationMatrix) => void;
  /** Turns every control off while you save, so changes never race. */
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
  onChange,
  disabled = false,
  title = 'Notifications',
  description,
  className,
}: NotificationPreferencesProps) {
  const groups = groupNotificationEvents(events);
  const on = notificationCount(value, events, channels);
  const lockNoteId = useId();
  const anyLocked = events.some((event) => (event.required?.length ?? 0) > 0);

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
          Notifications appear here once there is something to be told about.
        </EmptyNote>
      ) : (
        <>
          {/* Wide: one matrix, events down, channels across. */}
          <table className="hidden w-full border-collapse text-sm @xl:table">
            <caption className="sr-only">Notifications by event and channel</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pe-4 text-start font-medium text-fg-muted">
                  Event
                </th>
                {channels.map((channel) => {
                  const state = notificationColumnState(value, events, channel.id);
                  return (
                    <th key={channel.id} scope="col" className="w-28 px-2 py-2 font-medium">
                      <label className="flex cursor-pointer flex-col items-center gap-2">
                        <span>{channel.label}</span>
                        <Checkbox
                          aria-label={`Every event by ${channel.label}`}
                          checked={state === 'all'}
                          indeterminate={state === 'some'}
                          disabled={disabled}
                          onCheckedChange={(checked) => {
                            onChange(setNotificationColumn(value, events, channel.id, checked));
                          }}
                        />
                      </label>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.name}>
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={channels.length + 1}
                      className="pt-5 pb-1.5 text-start text-xs font-medium tracking-caps text-fg-subtle uppercase"
                    >
                      {group.name}
                    </th>
                  </tr>
                  {group.events.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-line transition-colors duration-fast ease-standard last:border-b-0 hover:bg-surface-hover"
                    >
                      <th scope="row" className="py-3 pe-4 text-start font-regular">
                        <span className="block font-medium text-fg">{event.label}</span>
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
                            lockNoteId={lockNoteId}
                            onChange={onChange}
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
          <div className="flex flex-col gap-5 @xl:hidden">
            {groups.map((group) => (
              <section key={group.name} aria-label={group.name} className="flex flex-col">
                <h3 className="pb-1.5 text-xs font-medium tracking-caps text-fg-subtle uppercase">
                  {group.name}
                </h3>
                <ul className="flex flex-col">
                  {group.events.map((event) => (
                    <li
                      key={event.id}
                      className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0"
                    >
                      <span className="flex flex-col text-sm">
                        <span className="font-medium">{event.label}</span>
                        {event.description !== undefined && (
                          <span className="text-fg-muted">{event.description}</span>
                        )}
                      </span>
                      <span
                        role="group"
                        aria-label={`Channels for ${event.label}`}
                        className="flex flex-wrap gap-x-6 gap-y-1"
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
                              lockNoteId={lockNoteId}
                              onChange={onChange}
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

          {anyLocked && (
            <p id={lockNoteId} className="flex items-center gap-1.5 text-sm text-fg-subtle">
              <LockSimpleIcon aria-hidden weight="bold" className="size-3.5" />
              Required to keep your account safe; these always go out.
            </p>
          )}
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
  lockNoteId,
  onChange,
  labelled = false,
}: {
  event: NotificationEvent;
  channel: NotificationChannel;
  value: NotificationMatrix;
  disabled: boolean;
  lockNoteId: string;
  onChange: (value: NotificationMatrix) => void;
  /** A visible label wraps the box, so it needs no name of its own. */
  labelled?: boolean;
}) {
  const locked = notificationLocked(event, channel.id);
  return (
    <span className={cn('relative inline-flex items-center', !labelled && 'justify-center')}>
      <Checkbox
        aria-label={labelled ? undefined : `${event.label} by ${channel.label}`}
        aria-describedby={locked ? lockNoteId : undefined}
        checked={notificationOn(value, event, channel.id)}
        disabled={disabled || locked}
        onCheckedChange={(checked) => {
          onChange(setNotification(value, event, channel.id, checked));
        }}
      />
      {locked && (
        <LockSimpleIcon
          aria-hidden
          weight="bold"
          className={cn(
            'size-3 text-fg-subtle',
            labelled ? 'ms-1.5' : 'absolute start-full ms-1.5',
          )}
        />
      )}
    </span>
  );
}

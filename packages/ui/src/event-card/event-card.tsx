import { ClockIcon, MapPinIcon, ProhibitIcon, QuestionIcon } from '@phosphor-icons/react';
import { useId, type ComponentProps, type ReactNode } from 'react';

import { AvatarGroup, type AvatarGroupItem } from '../avatar-group/avatar-group';
import { cn } from '../lib/cn';
import { resolveHourCycle } from '../time-field/time';

/** The event's colour, by what kind of event it is: a meeting, a deadline, time off. */
export type EventTone = 'accent' | 'info' | 'positive' | 'warning' | 'negative' | 'neutral';

/** Whether the event goes ahead: tentative and cancelled say so in words, never by colour alone. */
export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';

export interface EventCardProps extends Omit<ComponentProps<'article'>, 'title' | 'onSelect'> {
  title: string;
  start: Date;
  end: Date;
  /** A day-long event: the time reads "All day". */
  allDay?: boolean;
  location?: string;
  attendees?: readonly AvatarGroupItem[];
  tone?: EventTone;
  status?: EventStatus;
  /**
   * `full` (default) shows the time with its length, the place and the people; `compact` is a
   * tight block of title and time for a time grid or a dense list.
   */
  variant?: 'full' | 'compact';
  /**
   * `range` (default) writes the start and the end; `start` writes the start alone, for a compact
   * card too narrow for both. A tentative or cancelled compact card writes its status word and the
   * start, or on a start-only card the word alone. The whole range is still read out.
   */
  timeDisplay?: 'range' | 'start';
  /** BCP 47 tag for the times and the attendee names. */
  locale?: string;
  /** Opens the event: the title becomes a button that covers the whole card. */
  onSelect?: () => void;
  /** Extra props for that button, such as a roving `tabIndex` or a keyboard handler. */
  triggerProps?: Omit<ComponentProps<'button'>, 'type' | 'onClick' | 'children'> &
    Record<`data-${string}`, string | undefined>;
  /** Extra content under the details, such as a join link or an action. */
  footer?: ReactNode;
}

/**
 * Tint and border by tone, the same pairs a Badge uses, so an event reads as part of the kit. The
 * fill is quiet enough to put text on; the ink is the tone's strong step.
 */
const TONES: Record<EventTone, { surface: string; ink: string }> = {
  accent: { surface: 'border-accent-strong/25 bg-accent-subtle', ink: 'text-accent-strong' },
  info: { surface: 'border-info-strong/25 bg-info-subtle', ink: 'text-info-strong' },
  positive: {
    surface: 'border-positive-strong/25 bg-positive-subtle',
    ink: 'text-positive-strong',
  },
  warning: { surface: 'border-warning-strong/25 bg-warning-subtle', ink: 'text-warning-strong' },
  negative: {
    surface: 'border-negative-strong/25 bg-negative-subtle',
    ink: 'text-negative-strong',
  },
  // A tint of the ink, so it lifts off the surface in dark as well as light.
  neutral: { surface: 'border-fg/15 bg-surface-hover', ink: 'text-fg-muted' },
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * When an event happens, as words: `09:00 to 10:30`, `9:00 AM to 10:30 AM`, `All day`, or with the
 * days written when it runs past midnight: `Mon 16 Mar, 22:00 to Tue 17 Mar, 01:00`.
 */
export function formatEventTime(start: Date, end: Date, locale?: string, allDay = false): string {
  const day = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  if (allDay) {
    // An all-day end is exclusive or the same day; either way the last day is the one before it ends.
    const last = new Date(end.getTime() - 1);
    return end.getTime() - start.getTime() <= 86_400_000 || sameDay(start, last)
      ? 'All day'
      : `${day.format(start)} to ${day.format(last)}`;
  }
  // A 24 hour clock writes 09:00, as the time field does; a 12 hour one writes 9:00 AM.
  const time = new Intl.DateTimeFormat(locale, {
    hour: resolveHourCycle(locale) === 24 ? '2-digit' : 'numeric',
    minute: '2-digit',
  });
  return sameDay(start, end)
    ? `${time.format(start)} to ${time.format(end)}`
    : `${day.format(start)}, ${time.format(start)} to ${day.format(end)}, ${time.format(end)}`;
}

/** When an event starts, on the locale's clock: `09:00` or `9:00 AM`. */
export function formatEventStart(start: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: resolveHourCycle(locale) === 24 ? '2-digit' : 'numeric',
    minute: '2-digit',
  }).format(start);
}

/** How long an event lasts, short: `45 min`, `1 hr 30 min`, `3 days`. */
export function formatEventLength(start: Date, end: Date, locale?: string): string {
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
  const unit = (value: number, name: 'minute' | 'hour' | 'day') =>
    new Intl.NumberFormat(locale, { style: 'unit', unit: name, unitDisplay: 'short' }).format(
      value,
    );
  if (minutes >= 1440 && minutes % 1440 === 0) return unit(minutes / 1440, 'day');
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return unit(rest, 'minute');
  return rest === 0 ? unit(hours, 'hour') : `${unit(hours, 'hour')} ${unit(rest, 'minute')}`;
}

const STATUS_WORDS: Record<Exclude<EventStatus, 'confirmed'>, string> = {
  tentative: 'Tentative',
  cancelled: 'Cancelled',
};

/**
 * One event: what, when, where and who. The tone colours it by kind (from tokens, so a theme or a
 * skin restyles it), and a tentative or cancelled event says so in words with an icon. Give it
 * `onSelect` and the whole card opens the event, with one focus stop on its title.
 */
export function EventCard({
  title,
  start,
  end,
  allDay = false,
  location,
  attendees,
  tone = 'accent',
  status = 'confirmed',
  variant = 'full',
  timeDisplay = 'range',
  locale,
  onSelect,
  triggerProps,
  footer,
  className,
  ...props
}: EventCardProps) {
  const metaId = useId();
  const compact = variant === 'compact';
  const cancelled = status === 'cancelled';
  const colours = TONES[cancelled ? 'neutral' : tone];
  const when = formatEventTime(start, end, locale, allDay);
  const StatusIcon = status === 'tentative' ? QuestionIcon : ProhibitIcon;
  const statusWord = status === 'confirmed' ? null : STATUS_WORDS[status];

  // A compact card may lose its status word to a narrow column; the icon stays by the title.
  const compactIcon = compact && statusWord !== null && (
    <StatusIcon
      aria-hidden
      weight="bold"
      className={cn(
        'me-1 inline-block size-3 align-middle',
        cancelled ? 'text-fg-muted' : colours.ink,
      )}
    />
  );

  const titleClass = cn(
    'min-w-0 font-medium text-fg',
    compact ? 'line-clamp-2 text-sm leading-tight' : 'text-base',
    cancelled && 'text-fg-muted line-through decoration-fg-subtle',
  );

  const heading =
    onSelect === undefined ? (
      <span className={titleClass} title={compact ? title : undefined}>
        {compactIcon}
        {title}
      </span>
    ) : (
      <button
        type="button"
        aria-describedby={metaId}
        title={compact ? title : undefined}
        {...triggerProps}
        onClick={onSelect}
        className={cn(
          titleClass,
          'cursor-pointer text-start outline-none',
          // The button's box covers the card, so the whole card is one target.
          'after:absolute after:inset-0',
          triggerProps?.className,
        )}
      >
        {compactIcon}
        {title}
      </button>
    );

  const statusLabel = statusWord !== null && (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 text-xs font-medium',
        cancelled ? 'text-fg-muted' : colours.ink,
      )}
    >
      <StatusIcon aria-hidden weight="bold" className="size-3" />
      {statusWord}
    </span>
  );

  return (
    <article
      data-slot="event-card"
      data-variant={variant}
      data-tone={tone}
      data-status={status}
      className={cn(
        'group/event relative flex min-w-0 flex-col border text-fg',
        colours.surface,
        status === 'tentative' && 'border-dashed bg-surface',
        compact ? 'gap-0.5 overflow-hidden rounded-badge px-2 py-1' : 'gap-2 rounded-control p-3',
        onSelect !== undefined && [
          'transition-transform duration-fast ease-standard',
          'hover:border-line-strong active:scale-99 motion-reduce:active:scale-100',
          'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
        ],
        className,
      )}
      {...props}
    >
      {compact ? (
        <>
          {heading}
          <p id={metaId} className={cn('truncate text-xs numeric', colours.ink)}>
            {/* A status word comes first; on a start-only card it takes the time's place. */}
            {statusWord !== null && (
              <>
                <span className="font-medium">
                  {statusWord}
                  {timeDisplay === 'start' ? '' : ','}
                </span>{' '}
              </>
            )}
            {(timeDisplay === 'start' || statusWord !== null) && !allDay ? (
              <>
                {!(timeDisplay === 'start' && statusWord !== null) && (
                  <span aria-hidden>{formatEventStart(start, locale)}</span>
                )}
                <span className="sr-only">
                  {timeDisplay === 'start' && statusWord !== null ? ', ' : ''}
                  {when}
                </span>
              </>
            ) : (
              when
            )}
            {location !== undefined && <span className="sr-only">, {location}</span>}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            {heading}
            {statusLabel}
          </div>
          <div id={metaId} className="flex flex-col gap-1 text-sm text-fg-muted">
            {statusWord !== null && <span className="sr-only">{statusWord}. </span>}
            <span className="inline-flex items-center gap-1.5 numeric">
              <ClockIcon
                aria-hidden
                weight="bold"
                className={cn('size-3.5 shrink-0', colours.ink)}
              />
              <span>
                {when}
                {!allDay && (
                  <span className="text-fg-subtle">
                    <span className="sr-only">, </span>
                    <span aria-hidden> · </span>
                    {formatEventLength(start, end, locale)}
                  </span>
                )}
              </span>
            </span>
            {location !== undefined && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MapPinIcon
                  aria-hidden
                  weight="bold"
                  className={cn('size-3.5 shrink-0', colours.ink)}
                />
                <span className="truncate">{location}</span>
              </span>
            )}
          </div>
          {attendees !== undefined && attendees.length > 0 && (
            // Above the button's cover, so the names still show on hover and focus.
            <AvatarGroup
              items={attendees}
              label="Attendees"
              size="sm"
              max={3}
              names="always"
              locale={locale}
              className="relative z-10"
            />
          )}
          {footer !== undefined && <div className="relative z-10">{footer}</div>}
        </>
      )}
    </article>
  );
}

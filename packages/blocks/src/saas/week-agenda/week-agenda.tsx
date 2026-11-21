import { CalendarBlankIcon, CaretLeftIcon, CaretRightIcon, PlusIcon } from '@phosphor-icons/react';
import { cn, EventCard } from '@rectio/ui';
import {
  createContext,
  use,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { resolveLocale } from '../../lib/finance';
import { Segmented } from '../../lib/segmented';
import { countLabel } from '../lib/saas';
import { useNow } from '../lib/focus';
import { focusRing, touchTarget } from '../lib/styles';
import {
  agendaDays,
  agendaHourLabels,
  agendaNeighbor,
  agendaNowOffset,
  agendaSlot,
  agendaStep,
  agendaStops,
  agendaWeekStart,
  formatAgendaRange,
  isSameDay,
  layoutAllDay,
  layoutDayEvents,
  minutesOfDay,
  startOfDay,
  type AgendaEvent,
  type AgendaHours,
  type AgendaMove,
  type AgendaVariant,
  type PlacedAllDay,
  type PlacedEvent,
} from './week-agenda.logic';

export interface WeekAgendaProps {
  events: readonly AgendaEvent[];
  /** `week` (default) shows the week around `date` in seven columns; `day` shows that day alone. */
  variant?: AgendaVariant;
  /** Shows a Day and Week switch in the header. */
  onVariantChange?: (variant: AgendaVariant) => void;
  /** The day shown, or a day in the week shown. */
  date: Date;
  /** Shows Today, previous and next buttons; called with the day to show. */
  onDateChange?: (date: Date) => void;
  /** Opens an event: each event becomes a button. */
  onEventClick?: (event: AgendaEvent) => void;
  /**
   * Called with an empty slot's start and end when it is pressed, and from each day's Add event
   * button (the keyboard way in). Leave it out and the empty grid does nothing.
   */
  onSlotClick?: (slot: { start: Date; end: Date }) => void;
  /** The hours the grid shows. Default 8 to 19 (8:00 to 19:00); earlier and later events clamp to the edges. */
  hours?: AgendaHours;
  /** The length of a slot in minutes, for slot presses. Default 30. */
  slotMinutes?: number;
  /** The first day of the week, 0 for Sunday. Defaults to the locale's. */
  weekStartsOn?: number;
  /** The current time, for the time line and the Today mark. Pass it to render on the server. */
  now?: Date;
  locale?: string;
  /** Defaults to the days shown, such as 16 to 22 March 2026. */
  title?: string;
  description?: string;
  className?: string;
}

/**
 * The part of the agenda the motion variant moves: the grid and the list, which slide in from the
 * side the user stepped to. The plain variant draws them still.
 */
export interface AgendaParts {
  Stage: (props: { rangeKey: string; direction: number; children: ReactNode }) => ReactNode;
}

export const PLAIN_AGENDA_PARTS: AgendaParts = { Stage: ({ children }) => children };

const AgendaPartsContext = createContext<AgendaParts>(PLAIN_AGENDA_PARTS);

export function AgendaPartsProvider({
  parts,
  children,
}: {
  parts: AgendaParts;
  children: ReactNode;
}) {
  return <AgendaPartsContext value={parts}>{children}</AgendaPartsContext>;
}

const DEFAULT_HOURS: AgendaHours = { start: 8, end: 19 };

/** Height in the grid for a number of minutes, from the hour height token. */
const span = (minutes: number) => `calc(var(--rx-agenda-hour-height) * ${String(minutes / 60)})`;

const KEYS: Record<string, AgendaMove> = {
  ArrowDown: 'next',
  ArrowUp: 'previous',
  ArrowRight: 'right',
  ArrowLeft: 'left',
  Home: 'first',
  End: 'last',
};

/** Where the narrow list takes over from the grid: a week needs more room than a day. */
const BREAK = {
  week: { grid: 'hidden @3xl:block', list: '@3xl:hidden' },
  day: { grid: 'hidden @lg:block', list: '@lg:hidden' },
} as const;

/**
 * A day or a week of events on a time grid. Events that overlap sit side by side; all-day and
 * multi-day events run along a row above the hours; a line marks the current time. Press an event
 * to open it, or an empty slot to start a new one. Arrow keys move between events (Up and Down in
 * time, Left and Right by day). On a narrow screen the grid becomes a list of days.
 */
export function WeekAgenda({
  events,
  variant = 'week',
  onVariantChange,
  date,
  onDateChange,
  onEventClick,
  onSlotClick,
  hours = DEFAULT_HOURS,
  slotMinutes = 30,
  weekStartsOn,
  now: requestedNow,
  locale: requestedLocale,
  title,
  description,
  className,
}: WeekAgendaProps) {
  const locale = resolveLocale(requestedLocale);
  const now = useNow(requestedNow);
  const { Button } = useBlockParts();
  const { Stage } = use(AgendaPartsContext);
  const firstDay = weekStartsOn ?? agendaWeekStart(locale);
  // Keyed by plain values, so a new Date for the same day or new hours keep the layout.
  const dayKey = startOfDay(date).getTime();
  const { days, layout } = useMemo(() => {
    const shown = agendaDays(new Date(dayKey), variant, weekStartsOn ?? agendaWeekStart(locale));
    const shownHours = { start: hours.start, end: hours.end };
    const timed = shown.map((day) => layoutDayEvents(events, day, shownHours));
    const allDay = layoutAllDay(events, shown);
    return { days: shown, layout: { timed, allDay, stops: agendaStops(timed, allDay) } };
  }, [events, dayKey, variant, weekStartsOn, locale, hours.start, hours.end]);
  const rangeKey = `${variant}:${String(days[0]?.getTime() ?? 0)}`;
  // Which way the last step went, so the motion variant can slide from that side.
  const [step, setStep] = useState({ key: rangeKey, direction: 0 });
  const direction = step.key === rangeKey ? step.direction : 0;

  const inRange = layout.allDay.length + layout.timed.reduce((sum, day) => sum + day.length, 0);
  const unit = variant === 'week' ? 'week' : 'day';

  const go = (next: Date, by: number) => {
    const nextKey = `${variant}:${String(agendaDays(next, variant, firstDay)[0]?.getTime() ?? 0)}`;
    setStep({ key: nextKey, direction: by });
    onDateChange?.(next);
  };

  const actions =
    onDateChange === undefined && onVariantChange === undefined ? undefined : (
      <>
        {onVariantChange !== undefined && (
          <Segmented<AgendaVariant>
            label="View"
            value={variant}
            onValueChange={onVariantChange}
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
            ]}
          />
        )}
        {onDateChange !== undefined && (
          <div role="group" aria-label={`Change ${unit}`} className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={days.some((day) => isSameDay(day, now))}
              onClick={() => {
                go(startOfDay(now), now.getTime() < date.getTime() ? -1 : 1);
              }}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={`Previous ${unit}`}
              onClick={() => {
                go(agendaStep(date, variant, -1), -1);
              }}
            >
              <CaretLeftIcon aria-hidden weight="bold" className="size-4 rtl:-scale-x-100" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={`Next ${unit}`}
              onClick={() => {
                go(agendaStep(date, variant, 1), 1);
              }}
            >
              <CaretRightIcon aria-hidden weight="bold" className="size-4 rtl:-scale-x-100" />
            </Button>
          </div>
        )}
      </>
    );

  const shared = {
    days,
    layout,
    locale,
    now,
    hours,
    onEventClick,
    onSlotClick,
    slotMinutes,
    variant,
  };

  return (
    <BlockPanel
      title={title ?? formatAgendaRange(days, locale)}
      description={
        description ??
        (inRange === 0
          ? `Nothing scheduled this ${unit}`
          : `${countLabel(inRange, 'event')} this ${unit}`)
      }
      actions={actions}
      className={className}
      bodyClassName="gap-3"
    >
      <Stage rangeKey={rangeKey} direction={direction}>
        <div className={BREAK[variant].grid}>
          <AgendaGrid {...shared} empty={inRange === 0} />
        </div>
        <div className={BREAK[variant].list}>
          <AgendaList {...shared} empty={inRange === 0} />
        </div>
      </Stage>
    </BlockPanel>
  );
}

interface ViewProps {
  days: Date[];
  layout: {
    timed: PlacedEvent[][];
    allDay: PlacedAllDay[];
    stops: ReturnType<typeof agendaStops>;
  };
  locale: string;
  now: Date;
  hours: AgendaHours;
  slotMinutes: number;
  variant: AgendaVariant;
  empty: boolean;
  onEventClick: ((event: AgendaEvent) => void) | undefined;
  onSlotClick: ((slot: { start: Date; end: Date }) => void) | undefined;
}

/** A new event from a day's Add button starts at the next slot today, else the first hour shown. */
function addSlot(day: Date, now: Date, hours: AgendaHours, slotMinutes: number) {
  const nowMinutes = minutesOfDay(now);
  const start =
    isSameDay(day, now) && nowMinutes >= hours.start * 60 && nowMinutes < hours.end * 60
      ? Math.ceil(nowMinutes / slotMinutes) * slotMinutes
      : hours.start * 60;
  return agendaSlot(day, start, slotMinutes);
}

function useDayNames(locale: string) {
  return useMemo(
    () => ({
      weekday: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
      date: new Intl.DateTimeFormat(locale, { day: 'numeric' }),
      long: new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
      time: new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }),
    }),
    [locale],
  );
}

function AgendaGrid({
  days,
  layout,
  locale,
  now,
  hours,
  slotMinutes,
  variant,
  empty,
  onEventClick,
  onSlotClick,
}: ViewProps) {
  const names = useDayNames(locale);
  const grid = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const labels = agendaHourLabels(hours, locale);
  const windowMinutes = (hours.end - hours.start) * 60;
  // The one event in the tab order; arrow keys move it.
  const [active, setActive] = useState<string | null>(null);
  const tabStop =
    active !== null && layout.stops.some((stop) => stop.key === active)
      ? active
      : (layout.stops[0]?.key ?? null);
  const [hover, setHover] = useState<{ day: number; start: number } | null>(null);
  const columns = {
    gridTemplateColumns: `var(--rx-agenda-gutter-width) repeat(${String(days.length)}, minmax(0, 1fr))`,
  } as CSSProperties;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, key: string) => {
    const move = KEYS[event.key];
    if (move === undefined) return;
    event.preventDefault();
    const next = agendaNeighbor(layout.stops, key, move);
    if (next === null) return;
    setActive(next);
    grid.current?.querySelector<HTMLElement>(`[data-agenda-stop="${CSS.escape(next)}"]`)?.focus();
  };

  const trigger = (key: string, event: AgendaEvent, label: string) =>
    onEventClick === undefined
      ? {}
      : {
          onSelect: () => {
            onEventClick(event);
          },
          triggerProps: {
            'data-agenda-stop': key,
            tabIndex: tabStop === key ? 0 : -1,
            'aria-label': label,
            onFocus: () => {
              setActive(key);
            },
            onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
              onKeyDown(e, key);
            },
          },
        };

  const slotFromPointer = (event: { clientY: number; currentTarget: HTMLElement }) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientY - box.top) / box.height, 0), 0.9999);
    return Math.floor((hours.start * 60 + ratio * windowMinutes) / slotMinutes) * slotMinutes;
  };

  const allDayRows = layout.allDay.reduce((rows, bar) => Math.max(rows, bar.row + 1), 0);

  return (
    <div
      ref={grid}
      role="group"
      aria-label={variant === 'week' ? 'Week' : 'Day'}
      aria-describedby={onEventClick !== undefined && layout.stops.length > 1 ? hintId : undefined}
      data-slot="week-agenda-grid"
      data-variant={variant}
      className="overflow-hidden rounded-control border border-line bg-surface"
    >
      <p id={hintId} className="sr-only">
        Use the arrow keys to move between events: up and down in time, left and right by day.
      </p>
      {/* Day headings. */}
      <div className="grid border-b border-line" style={columns}>
        <div aria-hidden />
        {days.map((day) => {
          const today = isSameDay(day, now);
          const slot = addSlot(day, now, hours, slotMinutes);
          return (
            <div
              key={day.getTime()}
              className="group/day flex min-w-0 items-center justify-between gap-1 border-s border-line px-2 py-2"
            >
              <h3
                className="flex min-w-0 items-baseline gap-1.5"
                aria-label={names.long.format(day)}
              >
                <span
                  className={cn(
                    'text-xs font-medium tracking-caps text-fg-muted uppercase',
                    today && 'text-accent-strong',
                  )}
                >
                  {names.weekday.format(day)}
                </span>
                <span
                  className={cn(
                    'inline-flex min-w-7 items-center justify-center rounded-full px-1 text-lg leading-7 font-medium numeric',
                    today ? 'bg-accent text-accent-contrast' : 'text-fg',
                  )}
                >
                  {names.date.format(day)}
                </span>
                {today && <span className="sr-only">, today</span>}
              </h3>
              {onSlotClick !== undefined && (
                <button
                  type="button"
                  aria-label={`Add event, ${names.long.format(day)}`}
                  onClick={() => {
                    onSlotClick(slot);
                  }}
                  className={cn(
                    'relative inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-control text-fg-subtle',
                    'hover:bg-surface-hover hover:text-fg',
                    'transition-[opacity,background-color,color] duration-fast ease-standard',
                    'pointer-fine:opacity-0 pointer-fine:group-hover/day:opacity-100 pointer-fine:focus-visible:opacity-100',
                    focusRing,
                    touchTarget,
                  )}
                >
                  <PlusIcon aria-hidden weight="bold" className="size-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* The all-day row: bars over the days they cover, stacked when they meet. */}
      {layout.allDay.length > 0 && (
        <div className="grid border-b border-line" style={columns}>
          <div className="flex items-start justify-end px-2 py-1.5 text-xs text-fg-subtle">
            All day
          </div>
          <ol
            aria-label="All-day events"
            className="grid gap-1 border-s border-line p-1"
            style={{
              gridColumn: `2 / span ${String(days.length)}`,
              gridTemplateColumns: `repeat(${String(days.length)}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${String(allDayRows)}, auto)`,
            }}
          >
            {layout.allDay.map((bar) => (
              <li
                key={bar.key}
                className="min-w-0"
                style={{
                  gridColumn: `${String(bar.first + 1)} / ${String(bar.last + 2)}`,
                  gridRow: bar.row + 1,
                }}
              >
                <EventCard
                  variant="compact"
                  title={bar.event.title}
                  start={bar.event.start}
                  end={bar.event.end}
                  allDay
                  tone={bar.event.tone ?? 'accent'}
                  status={bar.event.status ?? 'confirmed'}
                  locale={locale}
                  {...(bar.event.location === undefined ? {} : { location: bar.event.location })}
                  // One line: the time reads "All day" to assistive technology only.
                  className={cn(
                    'flex-row items-center py-0.5 [&_p]:sr-only',
                    bar.continuesBefore && 'rounded-s-none',
                    bar.continuesAfter && 'rounded-e-none',
                  )}
                  {...trigger(
                    bar.key,
                    bar.event,
                    `${bar.event.title}, ${names.long.format(days[bar.first] ?? bar.event.start)}`,
                  )}
                />
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* The time grid. */}
      <div className="relative grid" style={columns}>
        <div aria-hidden className="relative">
          {labels.map((label, index) => (
            <div
              key={label}
              className="relative h-(--rx-agenda-hour-height) pe-2 text-end text-xs text-fg-subtle numeric"
            >
              {/* Each label sits on its hour's line; the first stays inside the grid. */}
              <span className={cn('relative block', index > 0 && '-top-2')}>
                {index > 0 && label}
              </span>
            </div>
          ))}
        </div>
        {days.map((day, dayIndex) => {
          const placed = layout.timed[dayIndex] ?? [];
          const nowAt = agendaNowOffset(now, day, hours);
          const today = isSameDay(day, now);
          const weekend = day.getDay() === 0 || day.getDay() === 6;
          const hovered = hover?.day === dayIndex ? hover.start : null;
          return (
            <section
              key={day.getTime()}
              aria-label={names.long.format(day)}
              className={cn(
                'relative min-w-0 border-s border-line',
                weekend && variant === 'week' && 'bg-surface-sunken/60',
                today && variant === 'week' && 'bg-accent-subtle/40',
              )}
            >
              {/* Hour lines, with a fainter half-hour line. */}
              <div aria-hidden>
                {labels.map((label, index) => (
                  <div
                    key={label}
                    className={cn(
                      'h-(--rx-agenda-hour-height)',
                      index > 0 && 'border-t border-line',
                    )}
                  >
                    <div className="h-1/2 border-b border-dashed border-line/60" />
                  </div>
                ))}
              </div>

              {/* Empty slots: a press anywhere starts an event there. */}
              {onSlotClick !== undefined && (
                <div
                  aria-hidden
                  data-slot="week-agenda-slots"
                  className="absolute inset-0 cursor-cell"
                  onPointerMove={(event) => {
                    if (event.pointerType !== 'mouse') return;
                    const start = slotFromPointer(event);
                    if (hovered !== start) setHover({ day: dayIndex, start });
                  }}
                  onPointerLeave={() => {
                    setHover(null);
                  }}
                  onClick={(event) => {
                    onSlotClick(agendaSlot(day, slotFromPointer(event), slotMinutes));
                  }}
                >
                  {hovered !== null && (
                    <div
                      className="pointer-events-none absolute inset-x-1 flex items-start gap-1 rounded-badge border border-dashed border-accent-strong/40 bg-accent-subtle/60 px-1.5 py-0.5 text-xs text-accent-strong numeric"
                      style={{ top: span(hovered - hours.start * 60), height: span(slotMinutes) }}
                    >
                      <PlusIcon aria-hidden weight="bold" className="mt-0.5 size-3 shrink-0" />
                      {names.time.format(agendaSlot(day, hovered, slotMinutes).start)}
                    </div>
                  )}
                </div>
              )}

              <ol className="pointer-events-none absolute inset-0">
                {placed.map((slice) => {
                  const minutes = slice.end - slice.start;
                  const short = minutes < 45;
                  return (
                    <li
                      key={slice.key}
                      className="pointer-events-auto absolute z-10 px-px pb-px"
                      style={{
                        top: span(slice.start - hours.start * 60),
                        height: span(minutes),
                        left: `${String((slice.column / slice.columns) * 100)}%`,
                        width: `${String((slice.span / slice.columns) * 100)}%`,
                      }}
                    >
                      <EventCard
                        variant="compact"
                        title={slice.event.title}
                        start={slice.event.start}
                        end={slice.event.end}
                        tone={slice.event.tone ?? 'accent'}
                        status={slice.event.status ?? 'confirmed'}
                        locale={locale}
                        {...(slice.event.location === undefined
                          ? {}
                          : { location: slice.event.location })}
                        className={cn(
                          'h-full shadow-raised',
                          short &&
                            'flex-row items-baseline gap-1.5 py-0.5 [&_button]:truncate [&>span]:truncate',
                          slice.continuesBefore && 'rounded-t-none border-t-0',
                          slice.continuesAfter && 'rounded-b-none border-b-0',
                        )}
                        {...trigger(
                          slice.key,
                          slice.event,
                          `${slice.event.title}, ${names.long.format(day)}`,
                        )}
                      />
                    </li>
                  );
                })}
              </ol>

              {nowAt !== null && (
                <div
                  data-slot="week-agenda-now"
                  className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                  style={{ top: span(nowAt) }}
                >
                  <span className="-ms-1 size-2 shrink-0 -translate-y-1/2 rounded-full bg-accent" />
                  <span className="h-0.5 flex-1 -translate-y-1/2 bg-accent" />
                  <span className="sr-only">Now, {names.time.format(now)}</span>
                </div>
              )}
              {today && nowAt === null && <span className="sr-only">Today</span>}
            </section>
          );
        })}
        {empty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <p className="flex max-w-72 flex-col items-center gap-1.5 rounded-control border border-dashed border-line-strong bg-surface px-4 py-3 text-center text-sm text-fg-muted shadow-raised">
              <CalendarBlankIcon aria-hidden weight="duotone" className="size-6 text-fg-subtle" />
              <span className="font-medium text-fg">Nothing scheduled</span>
              {onSlotClick !== undefined && (
                <span>Press a slot or a day&rsquo;s plus to add an event.</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** The narrow layout: each day as a heading with its events listed under it. */
function AgendaList({
  days,
  layout,
  locale,
  now,
  hours,
  slotMinutes,
  variant,
  empty,
  onEventClick,
  onSlotClick,
}: ViewProps) {
  const names = useDayNames(locale);
  if (empty && variant === 'week') {
    return (
      <EmptyNote
        icon={CalendarBlankIcon}
        title="Nothing scheduled this week"
        action={
          onSlotClick === undefined || days[0] === undefined ? undefined : (
            <AddButton
              label="Add event"
              onClick={() => {
                const first = days.find((day) => isSameDay(day, now)) ?? days[0] ?? now;
                onSlotClick(addSlot(first, now, hours, slotMinutes));
              }}
            />
          )
        }
      >
        Events you add for these days show up here.
      </EmptyNote>
    );
  }
  return (
    <ol data-slot="week-agenda-list" className="flex flex-col gap-5">
      {days.map((day, dayIndex) => {
        const today = isSameDay(day, now);
        const dayStart = startOfDay(day).getTime();
        const allDay = layout.allDay
          .filter((bar) => bar.first <= dayIndex && bar.last >= dayIndex)
          .map((bar) => ({ key: `${bar.key}:${String(dayIndex)}`, event: bar.event }));
        const timed = (layout.timed[dayIndex] ?? [])
          .slice()
          .sort((a, b) => a.start - b.start || a.column - b.column)
          .map((slice) => ({ key: slice.key, event: slice.event }));
        const items = [...allDay, ...timed];
        const headingId = `${String(dayStart)}-${String(dayIndex)}`;
        return (
          <li key={dayStart} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-1.5">
              <h3 id={headingId} className="flex items-baseline gap-2 text-sm font-medium">
                <span className={cn(today && 'text-accent-strong')}>{names.long.format(day)}</span>
                {today && (
                  <span className="rounded-badge bg-accent-subtle px-1.5 text-xs font-medium text-accent-strong">
                    Today
                  </span>
                )}
              </h3>
              {onSlotClick !== undefined && (
                <AddButton
                  label="Add"
                  aria-label={`Add event, ${names.long.format(day)}`}
                  onClick={() => {
                    onSlotClick(addSlot(day, now, hours, slotMinutes));
                  }}
                />
              )}
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-fg-subtle">Nothing scheduled</p>
            ) : (
              <ol aria-labelledby={headingId} className="flex flex-col gap-2">
                {items.map(({ key, event }) => (
                  <li key={key}>
                    <EventCard
                      variant={variant === 'day' ? 'full' : 'compact'}
                      title={event.title}
                      start={event.start}
                      end={event.end}
                      allDay={
                        event.allDay === true ||
                        event.end.getTime() - event.start.getTime() >= 86_400_000
                      }
                      tone={event.tone ?? 'accent'}
                      status={event.status ?? 'confirmed'}
                      locale={locale}
                      {...(event.location === undefined ? {} : { location: event.location })}
                      {...(event.attendees === undefined
                        ? {}
                        : {
                            attendees: event.attendees.map((person) => ({
                              name: person.name,
                              src: person.avatarUrl,
                            })),
                          })}
                      className={cn(variant === 'week' && 'py-1.5')}
                      {...(onEventClick === undefined
                        ? {}
                        : {
                            onSelect: () => {
                              onEventClick(event);
                            },
                          })}
                    />
                  </li>
                ))}
              </ol>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function AddButton({
  label,
  onClick,
  'aria-label': ariaLabel,
}: {
  label: string;
  onClick: () => void;
  'aria-label'?: string;
}) {
  const { Button } = useBlockParts();
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={ariaLabel}
      onClick={onClick}
      className="text-fg-muted"
    >
      <PlusIcon aria-hidden weight="bold" className="size-3.5" />
      {label}
    </Button>
  );
}

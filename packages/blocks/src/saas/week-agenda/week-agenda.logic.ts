import type { EventStatus, EventTone } from '@rectio/ui';

export interface AgendaAttendee {
  name: string;
  avatarUrl?: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  start: Date;
  /** Exclusive: an event from 9:00 to 10:00 ends at 10:00. An all-day event ends at the next midnight. */
  end: Date;
  /** Sits in the all-day row instead of the time grid. Events of 24 hours or more do too. */
  allDay?: boolean;
  location?: string;
  attendees?: readonly AgendaAttendee[];
  tone?: EventTone;
  status?: EventStatus;
}

export type AgendaVariant = 'day' | 'week';

/** The hours the grid shows, such as 8 to 19: from the start of `start` to the start of `end`. */
export interface AgendaHours {
  start: number;
  end: number;
}

/** An event the grid places: its slice of one day, in minutes from that day's midnight. */
export interface PlacedEvent {
  event: AgendaEvent;
  /** A stable key for this slice: an event over midnight has one slice per day. */
  key: string;
  start: number;
  end: number;
  /** The column it sits in among the events it overlaps, from 0, and how many columns it spans. */
  column: number;
  span: number;
  /** Columns in its overlap group: its width is `span / columns` of the day. */
  columns: number;
  /** Its overlap group in the day, counted from 0 in time order. */
  group: number;
  /** True when the event started before this slice: an earlier day, or above the hours shown. */
  continuesBefore: boolean;
  continuesAfter: boolean;
}

/** An event in the all-day row: the days it covers, as indices into the days shown. */
export interface PlacedAllDay {
  event: AgendaEvent;
  key: string;
  first: number;
  last: number;
  /** Its line in the row, from 0, so events over the same days stack instead of overlapping. */
  row: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

const DAY_MS = 86_400_000;
/** The shortest an event is drawn, in minutes, so a five minute call still has a line of text. */
export const AGENDA_MIN_MINUTES = 24;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** Minutes since that day's midnight. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * The first day of the week where the locale lives: Monday in most of Europe, Sunday in the
 * United States. 0 is Sunday. Read from Intl where the runtime knows it.
 */
export function agendaWeekStart(locale?: string): number {
  try {
    const tag = new Intl.Locale(locale ?? Intl.DateTimeFormat().resolvedOptions().locale);
    const info =
      (
        tag as Intl.Locale & {
          getWeekInfo?: () => { firstDay: number };
          weekInfo?: { firstDay: number };
        }
      ).getWeekInfo?.() ?? (tag as Intl.Locale & { weekInfo?: { firstDay: number } }).weekInfo;
    // Intl counts Monday as 1 and Sunday as 7.
    if (info !== undefined) return info.firstDay % 7;
    return ['US', 'CA', 'JP', 'BR', 'MX', 'IL', 'PH'].includes(tag.maximize().region ?? '') ? 0 : 1;
  } catch {
    return 1;
  }
}

/** The days a variant shows around `date`: that day alone, or its whole week. */
export function agendaDays(date: Date, variant: AgendaVariant, weekStartsOn = 1): Date[] {
  const day = startOfDay(date);
  if (variant === 'day') return [day];
  const back = (day.getDay() - weekStartsOn + 7) % 7;
  const first = addDays(day, -back);
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}

/** Where the previous or next button goes: a day or a week away. */
export function agendaStep(date: Date, variant: AgendaVariant, direction: 1 | -1): Date {
  return addDays(date, (variant === 'day' ? 1 : 7) * direction);
}

/** True when an event belongs in the all-day row: marked all day, or a day long or more. */
export function isAllDayEvent(event: AgendaEvent): boolean {
  return event.allDay === true || event.end.getTime() - event.start.getTime() >= DAY_MS;
}

/** An all-day event's exclusive end: the next midnight when the app gave the same day. */
function allDayEnd(event: AgendaEvent): number {
  const end = event.allDay === true ? startOfDay(event.end) : event.end;
  const start = event.allDay === true ? startOfDay(event.start) : event.start;
  return end.getTime() > start.getTime() ? end.getTime() : addDays(start, 1).getTime();
}

/**
 * The timed events of one day laid out in columns. Events that overlap, directly or through a
 * chain, form a group; each takes the first column free at its start, and then widens into the
 * columns to its right that nothing beside it uses. Times are clamped to the hours shown, and each
 * event is at least `AGENDA_MIN_MINUTES` tall.
 */
export function layoutDayEvents(
  events: readonly AgendaEvent[],
  day: Date,
  hours: AgendaHours = { start: 0, end: 24 },
): PlacedEvent[] {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = addDays(day, 1).getTime();
  const windowStart = hours.start * 60;
  const windowEnd = hours.end * 60;
  const slices: Omit<PlacedEvent, 'column' | 'span' | 'columns' | 'group'>[] = [];

  for (const event of events) {
    if (isAllDayEvent(event)) continue;
    const from = Math.max(event.start.getTime(), dayStart);
    const to = Math.min(event.end.getTime(), dayEnd);
    // An event ending exactly at midnight does not spill an empty slice into the next day.
    if (to <= from && !(from === to && event.start.getTime() === event.end.getTime())) continue;
    let start = Math.round((from - dayStart) / 60_000);
    let end = Math.round((to - dayStart) / 60_000);
    const clippedBefore = start < windowStart;
    const clippedAfter = end > windowEnd;
    start = Math.min(Math.max(start, windowStart), windowEnd - AGENDA_MIN_MINUTES);
    end = Math.max(Math.min(end, windowEnd), start + AGENDA_MIN_MINUTES);
    slices.push({
      event,
      key: `${event.id}@${String(dayStart)}`,
      start,
      end,
      continuesBefore: event.start.getTime() < dayStart || clippedBefore,
      continuesAfter: event.end.getTime() > dayEnd || clippedAfter,
    });
  }

  slices.sort((a, b) => a.start - b.start || b.end - a.end || a.event.id.localeCompare(b.event.id));

  const placed: PlacedEvent[] = [];
  let group: (typeof placed)[number][] = [];
  let groupEnd = -1;
  let lanes: number[] = [];
  let groupIndex = 0;

  const closeGroup = () => {
    if (group.length === 0) return;
    const columns = lanes.length;
    for (const item of group) {
      // Widen into the columns to the right while nothing there overlaps this event.
      let span = 1;
      while (
        item.column + span < columns &&
        !group.some(
          (other) =>
            other.column === item.column + span && other.start < item.end && item.start < other.end,
        )
      ) {
        span += 1;
      }
      placed.push({ ...item, span, columns, group: groupIndex });
    }
    groupIndex += 1;
    group = [];
    lanes = [];
  };

  for (const slice of slices) {
    if (slice.start >= groupEnd) {
      closeGroup();
      groupEnd = -1;
    }
    let column = lanes.findIndex((laneEnd) => laneEnd <= slice.start);
    if (column === -1) {
      column = lanes.length;
      lanes.push(slice.end);
    } else {
      lanes[column] = slice.end;
    }
    group.push({ ...slice, column, span: 1, columns: 1, group: groupIndex });
    groupEnd = Math.max(groupEnd, slice.end);
  }
  closeGroup();
  return placed;
}

/** The events of a crowded group that do not fit, gathered behind one "+N" button. */
export interface AgendaMore {
  key: string;
  events: AgendaEvent[];
  /** Where the button sits: the first hidden event's start, in the last column. */
  start: number;
  end: number;
  column: number;
  columns: number;
}

/**
 * Keeps a day readable when many events overlap: a group wider than `maxColumns` keeps its first
 * `maxColumns - 1` columns and gathers the rest behind one "+N" button in the last column, so no
 * event shrinks to a sliver. Groups that fit are left as they are.
 */
export function collapseColumns(
  placed: readonly PlacedEvent[],
  maxColumns: number,
): { shown: PlacedEvent[]; more: AgendaMore[] } {
  const limit = Math.max(1, Math.floor(maxColumns));
  const shown: PlacedEvent[] = [];
  const hidden = new Map<number, PlacedEvent[]>();
  for (const slice of placed) {
    if (slice.columns <= limit) {
      shown.push(slice);
    } else if (slice.column < limit - 1) {
      shown.push({
        ...slice,
        columns: limit,
        span: Math.min(slice.span, limit - 1 - slice.column),
      });
    } else {
      hidden.set(slice.group, [...(hidden.get(slice.group) ?? []), slice]);
    }
  }
  const more = [...hidden.entries()].map(([group, slices]) => {
    const first = slices.reduce((a, b) => (b.start < a.start ? b : a));
    return {
      key: `more@${String(group)}@${first.key}`,
      events: slices.sort((a, b) => a.start - b.start).map((slice) => slice.event),
      start: first.start,
      end: Math.max(...slices.map((slice) => slice.end)),
      column: limit - 1,
      columns: limit,
    };
  });
  return { shown, more };
}

/**
 * The hours a grid shows: the default window, widened to the whole hours that the timed events in
 * these days need, so an early cut-off or a late call is never cropped.
 */
export function agendaFitHours(
  events: readonly AgendaEvent[],
  days: readonly Date[],
  fallback: AgendaHours = { start: 8, end: 19 },
): AgendaHours {
  const first = days[0];
  const last = days.at(-1);
  if (first === undefined || last === undefined) return fallback;
  let start = fallback.start;
  let end = fallback.end;
  for (const day of days) {
    for (const slice of layoutDayEvents(events, day)) {
      start = Math.min(start, Math.floor(slice.start / 60));
      end = Math.max(end, Math.ceil(slice.end / 60));
    }
  }
  return { start, end: Math.min(24, end) };
}

/**
 * The all-day row: each all-day (or day-long) event as a bar over the days it covers, stacked
 * into rows so bars over the same days never overlap. Earlier and longer events take higher rows.
 */
export function layoutAllDay(
  events: readonly AgendaEvent[],
  days: readonly Date[],
): PlacedAllDay[] {
  const firstDay = days[0];
  const lastDay = days.at(-1);
  if (firstDay === undefined || lastDay === undefined) return [];
  const rangeStart = startOfDay(firstDay).getTime();
  const rangeEnd = addDays(lastDay, 1).getTime();
  const bars = events
    .filter(isAllDayEvent)
    .map((event) => {
      const start =
        event.allDay === true ? startOfDay(event.start).getTime() : event.start.getTime();
      const end = allDayEnd(event);
      return { event, start, end };
    })
    .filter(({ start, end }) => start < rangeEnd && end > rangeStart)
    .map(({ event, start, end }) => {
      const covered = days
        .map((day, index) => ({ index, from: startOfDay(day).getTime() }))
        .filter(({ from }) => start < from + DAY_MS && end > from)
        .map(({ index }) => index);
      return {
        event,
        first: covered[0] ?? 0,
        last: covered.at(-1) ?? 0,
        continuesBefore: start < rangeStart,
        continuesAfter: end > rangeEnd,
      };
    })
    .sort(
      (a, b) =>
        a.first - b.first ||
        b.last - b.first - (a.last - a.first) ||
        a.event.id.localeCompare(b.event.id),
    );

  const rows: number[] = [];
  return bars.map((bar) => {
    let row = rows.findIndex((lastIndex) => lastIndex < bar.first);
    if (row === -1) {
      row = rows.length;
      rows.push(bar.last);
    } else {
      rows[row] = bar.last;
    }
    return { ...bar, key: `${bar.event.id}@all`, row };
  });
}

/** Where the current time line sits, in minutes from the top of the hours shown, or null. */
export function agendaNowOffset(now: Date, day: Date, hours: AgendaHours): number | null {
  if (!isSameDay(now, day)) return null;
  const minutes = minutesOfDay(now) + now.getSeconds() / 60;
  if (minutes < hours.start * 60 || minutes > hours.end * 60) return null;
  return minutes - hours.start * 60;
}

/** The empty slot at a point in a day: `minutes` from midnight, rounded down to the slot size. */
export function agendaSlot(
  day: Date,
  minutes: number,
  slotMinutes = 30,
): { start: Date; end: Date } {
  const from = Math.max(
    0,
    Math.min(1440 - slotMinutes, Math.floor(minutes / slotMinutes) * slotMinutes),
  );
  const base = startOfDay(day);
  return {
    start: new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, from),
    end: new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, from + slotMinutes),
  };
}

/** One stop for the arrow keys: an event slice, the day it is in and where it starts. */
export interface AgendaStop {
  key: string;
  day: number;
  /** Minutes from midnight; all-day events count as -1, above the first hour. */
  start: number;
  column: number;
}

export type AgendaMove = 'next' | 'previous' | 'left' | 'right' | 'first' | 'last';

/** Every stop in reading order: day by day, all-day first, then by start and column. */
export function agendaStops(
  timed: readonly (readonly PlacedEvent[])[],
  allDay: readonly PlacedAllDay[],
  more: readonly (readonly AgendaMore[])[] = [],
): AgendaStop[] {
  const stops: AgendaStop[] = [
    ...allDay.map((bar) => ({ key: bar.key, day: bar.first, start: -1, column: bar.row })),
    ...timed.flatMap((placed, day) =>
      placed.map((slice) => ({ key: slice.key, day, start: slice.start, column: slice.column })),
    ),
    ...more.flatMap((chips, day) =>
      chips.map((chip) => ({ key: chip.key, day, start: chip.start, column: chip.column })),
    ),
  ];
  return stops.sort((a, b) => a.day - b.day || a.start - b.start || a.column - b.column);
}

/**
 * Where an arrow key goes from one event: Down and Up to the next and previous event in reading
 * order, Left and Right to the event nearest in time on the closest day that has one, Home and End
 * to the first and last. Null when there is nowhere to go.
 */
export function agendaNeighbor(
  stops: readonly AgendaStop[],
  key: string,
  move: AgendaMove,
): string | null {
  const index = stops.findIndex((stop) => stop.key === key);
  const from = stops[index];
  if (from === undefined) return stops[0]?.key ?? null;
  if (move === 'first') return stops[0]?.key ?? null;
  if (move === 'last') return stops.at(-1)?.key ?? null;
  if (move === 'next') return stops[index + 1]?.key ?? null;
  if (move === 'previous') return stops[index - 1]?.key ?? null;
  const step = move === 'right' ? 1 : -1;
  const days = [...new Set(stops.map((stop) => stop.day))].sort((a, b) => a - b);
  const target = (step === 1 ? days : [...days].reverse()).find((day) =>
    step === 1 ? day > from.day : day < from.day,
  );
  if (target === undefined) return null;
  const candidates = stops.filter((stop) => stop.day === target);
  candidates.sort((a, b) => Math.abs(a.start - from.start) - Math.abs(b.start - from.start));
  return candidates[0]?.key ?? null;
}

/** The days a slice of events covers, for the heading: `16 to 22 March 2026` or `Monday, 16 March 2026`. */
export function formatAgendaRange(days: readonly Date[], locale?: string): string {
  const first = days[0];
  const last = days.at(-1);
  if (first === undefined || last === undefined) return '';
  if (days.length === 1) {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(first);
  }
  const full = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const sameMonth =
    first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();
  const sameYear = first.getFullYear() === last.getFullYear();
  const start = sameMonth
    ? new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(first)
    : new Intl.DateTimeFormat(
        locale,
        sameYear
          ? { day: 'numeric', month: 'long' }
          : { day: 'numeric', month: 'long', year: 'numeric' },
      ).format(first);
  return `${start} to ${full.format(last)}`;
}

/** The labels beside the grid, one per hour shown: `08:00` or `8 AM`. */
export function agendaHourLabels(hours: AgendaHours, locale?: string): string[] {
  const twentyFour =
    new Intl.DateTimeFormat(locale, { hour: 'numeric' })
      .resolvedOptions()
      .hourCycle?.startsWith('h2') ?? true;
  const format = new Intl.DateTimeFormat(
    locale,
    twentyFour ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : { hour: 'numeric' },
  );
  return Array.from({ length: Math.max(0, hours.end - hours.start) }, (_, index) =>
    format.format(new Date(2026, 0, 1, hours.start + index)),
  );
}

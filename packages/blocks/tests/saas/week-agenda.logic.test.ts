import { describe, expect, it } from 'vitest';

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
  isAllDayEvent,
  layoutAllDay,
  layoutDayEvents,
  type AgendaEvent,
} from '../../src/index';

/** 16 March 2026 is a Monday. */
const at = (day: number, hour: number, minute = 0) => new Date(2026, 2, day, hour, minute);
const ev = (id: string, start: Date, end: Date, extra: Partial<AgendaEvent> = {}): AgendaEvent => ({
  id,
  title: id,
  start,
  end,
  ...extra,
});
const MONDAY = new Date(2026, 2, 16);
const shape = (placed: ReturnType<typeof layoutDayEvents>) =>
  Object.fromEntries(placed.map((p) => [p.event.id, [p.column, p.span, p.columns]]));

describe('agenda days', () => {
  it('shows the day or its week from the locale week start', () => {
    const wednesday = at(18, 15);
    expect(agendaDays(wednesday, 'day').map((d) => d.getDate())).toEqual([18]);
    expect(agendaDays(wednesday, 'week', 1).map((d) => d.getDate())).toEqual([
      16, 17, 18, 19, 20, 21, 22,
    ]);
    expect(agendaDays(wednesday, 'week', 0).map((d) => d.getDate())).toEqual([
      15, 16, 17, 18, 19, 20, 21,
    ]);
    expect(agendaWeekStart('en-GB')).toBe(1);
    expect(agendaWeekStart('en-US')).toBe(0);
    expect(agendaStep(wednesday, 'week', -1).getDate()).toBe(11);
    expect(agendaStep(wednesday, 'day', 1).getDate()).toBe(19);
  });

  it('writes the range and the hour labels', () => {
    expect(formatAgendaRange(agendaDays(MONDAY, 'week', 1), 'en-GB')).toBe('16 to 22 March 2026');
    expect(formatAgendaRange(agendaDays(at(31, 9), 'week', 1), 'en-GB')).toBe(
      '30 March to 5 April 2026',
    );
    expect(formatAgendaRange([MONDAY], 'en-GB')).toBe('Monday, 16 March 2026');
    expect(agendaHourLabels({ start: 8, end: 10 }, 'en-GB')).toEqual(['08:00', '09:00']);
    expect(agendaHourLabels({ start: 8, end: 10 }, 'en-US')).toEqual(['8 AM', '9 AM']);
  });
});

describe('layoutDayEvents', () => {
  it('gives events that do not overlap the whole width', () => {
    const placed = layoutDayEvents(
      [ev('a', at(16, 9), at(16, 10)), ev('b', at(16, 10), at(16, 11))],
      MONDAY,
    );
    expect(shape(placed)).toEqual({ a: [0, 1, 1], b: [0, 1, 1] });
    expect(placed.find((p) => p.event.id === 'a')).toMatchObject({ start: 540, end: 600 });
  });

  it('sets overlapping events side by side and widens into free columns', () => {
    // a overlaps b and c; b and c do not overlap each other; d overlaps only c.
    const placed = layoutDayEvents(
      [
        ev('a', at(16, 9), at(16, 12)),
        ev('b', at(16, 9), at(16, 10)),
        ev('c', at(16, 10, 30), at(16, 11, 30)),
        ev('d', at(16, 11), at(16, 13)),
      ],
      MONDAY,
    );
    // Longer first at the same start: a takes column 0, b column 1; c reuses column 1; d needs 2.
    expect(shape(placed)).toEqual({
      a: [0, 1, 3],
      b: [1, 2, 3],
      c: [1, 1, 3],
      d: [2, 1, 3],
    });
  });

  it('starts a new group once the earlier events have ended', () => {
    const placed = layoutDayEvents(
      [
        ev('a', at(16, 9), at(16, 10)),
        ev('b', at(16, 9, 30), at(16, 10)),
        ev('c', at(16, 14), at(16, 15)),
      ],
      MONDAY,
    );
    expect(shape(placed)).toEqual({ a: [0, 1, 2], b: [1, 1, 2], c: [0, 1, 1] });
  });

  it('clamps to the hours shown, splits events over midnight and keeps short events tall', () => {
    const hours = { start: 8, end: 19 };
    const placed = layoutDayEvents(
      [
        ev('early', at(16, 7), at(16, 9)),
        ev('late', at(16, 18), at(16, 23)),
        ev('blip', at(16, 12), at(16, 12, 5)),
        ev('night', at(15, 22), at(16, 1)),
        ev('allday', at(16, 0), at(17, 0), { allDay: true }),
      ],
      MONDAY,
      hours,
    );
    const by = Object.fromEntries(placed.map((p) => [p.event.id, p]));
    expect(by.early).toMatchObject({ start: 480, end: 540, continuesBefore: true });
    expect(by.late).toMatchObject({ start: 1080, end: 1140, continuesAfter: true });
    expect(by.blip).toMatchObject({ start: 720, end: 740 });
    expect(by.night).toMatchObject({ start: 480, continuesBefore: true, continuesAfter: false });
    expect(by.allday).toBeUndefined();
  });

  it('leaves out events of other days', () => {
    expect(layoutDayEvents([ev('a', at(17, 9), at(17, 10))], MONDAY)).toEqual([]);
    // Ending at midnight does not spill into the next day.
    expect(layoutDayEvents([ev('a', at(15, 23), at(16, 0))], MONDAY)).toEqual([]);
  });
});

describe('layoutAllDay', () => {
  it('spans bars over their days and stacks the ones that meet', () => {
    const days = agendaDays(MONDAY, 'week', 1);
    const bars = layoutAllDay(
      [
        ev('trip', at(17, 0), at(20, 0), { allDay: true }),
        ev('holiday', at(18, 0), at(18, 0), { allDay: true }),
        ev('offsite', at(16, 9), at(17, 17)),
        ev('before', at(10, 0), at(17, 0), { allDay: true }),
        ev('short', at(16, 9), at(16, 10)),
      ],
      days,
    );
    const by = Object.fromEntries(bars.map((b) => [b.event.id, [b.first, b.last, b.row]]));
    expect(by).toEqual({
      // Longer first on the same day: the offsite takes the top row.
      offsite: [0, 1, 0],
      before: [0, 0, 1],
      trip: [1, 3, 1],
      holiday: [2, 2, 0],
    });
    expect(bars.find((b) => b.event.id === 'before')?.continuesBefore).toBe(true);
    expect(isAllDayEvent(ev('x', at(16, 9), at(17, 9)))).toBe(true);
  });
});

describe('now, slots and keyboard moves', () => {
  it('places the now line and finds the slot under a point', () => {
    const hours = { start: 8, end: 19 };
    expect(agendaNowOffset(at(16, 9, 30), MONDAY, hours)).toBe(90);
    expect(agendaNowOffset(at(17, 9, 30), MONDAY, hours)).toBeNull();
    expect(agendaNowOffset(at(16, 20), MONDAY, hours)).toBeNull();
    expect(agendaSlot(MONDAY, 9 * 60 + 47, 30)).toEqual({ start: at(16, 9, 30), end: at(16, 10) });
    expect(agendaSlot(MONDAY, 9 * 60 + 47, 15).start).toEqual(at(16, 9, 45));
  });

  it('moves in reading order with Up and Down, and by day with Left and Right', () => {
    const days = agendaDays(MONDAY, 'week', 1);
    const events = [
      ev('mon9', at(16, 9), at(16, 10)),
      ev('mon14', at(16, 14), at(16, 15)),
      ev('wed10', at(18, 10), at(18, 11)),
      ev('wed15', at(18, 15), at(18, 16)),
      ev('tue', at(17, 0), at(18, 0), { allDay: true }),
    ];
    const timed = days.map((day) => layoutDayEvents(events, day));
    const stops = agendaStops(timed, layoutAllDay(events, days));
    const key = (id: string) => stops.find((s) => s.key.startsWith(`${id}@`))?.key ?? '';
    const id = (k: string | null) => k?.split('@')[0];
    expect(stops.map((s) => id(s.key))).toEqual(['mon9', 'mon14', 'tue', 'wed10', 'wed15']);
    expect(id(agendaNeighbor(stops, key('mon9'), 'next'))).toBe('mon14');
    expect(id(agendaNeighbor(stops, key('mon9'), 'previous'))).toBeUndefined();
    expect(id(agendaNeighbor(stops, key('mon14'), 'right'))).toBe('tue');
    expect(id(agendaNeighbor(stops, key('tue'), 'right'))).toBe('wed10');
    expect(id(agendaNeighbor(stops, key('wed15'), 'left'))).toBe('tue');
    expect(id(agendaNeighbor(stops, key('wed15'), 'right'))).toBeUndefined();
    expect(id(agendaNeighbor(stops, key('mon14'), 'last'))).toBe('wed15');
  });
});

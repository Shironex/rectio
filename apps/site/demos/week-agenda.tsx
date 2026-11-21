'use client';

import type { AgendaEvent, AgendaVariant, WeekAgendaProps } from '@rectio/blocks';
import { WeekAgenda } from '@rectio/blocks';
import { useState } from 'react';

/** A fixed week, so the example never drifts with the clock: Monday 16 to Sunday 22 March 2026. */
const NOW = new Date(2026, 2, 18, 11, 40);
const at = (day: number, hour: number, minute = 0) => new Date(2026, 2, day, hour, minute);
const TEAM = [{ name: 'Ines Duarte' }, { name: 'Callum Ross' }, { name: 'Priya Raman' }];

const EVENTS: AgendaEvent[] = [
  {
    id: 'close',
    title: 'March close',
    start: at(16, 0),
    end: at(19, 0),
    allDay: true,
    tone: 'accent',
  },
  {
    id: 'audit',
    title: 'Auditors on site',
    start: at(19, 0),
    end: at(21, 0),
    allDay: true,
    tone: 'warning',
  },
  ...[16, 17, 18, 19, 20].map((day) => ({
    id: `standup-${String(day)}`,
    title: 'Finance standup',
    start: at(day, 9),
    end: at(day, 9, 15),
    tone: 'accent' as const,
    attendees: TEAM,
  })),
  {
    id: 'accruals',
    title: 'Accruals review',
    start: at(16, 10),
    end: at(16, 11, 30),
    location: 'Room 4',
  },
  {
    id: 'bank',
    title: 'Bank reconciliation',
    start: at(16, 10, 30),
    end: at(16, 12),
    tone: 'positive',
  },
  {
    id: 'payments',
    title: 'Supplier payment run',
    start: at(17, 11),
    end: at(17, 12, 30),
    tone: 'positive',
  },
  {
    id: 'tax',
    title: 'VAT return check',
    start: at(17, 14),
    end: at(17, 15),
    tone: 'warning',
    status: 'tentative',
  },
  {
    id: 'board',
    title: 'Board pack: cash section',
    start: at(18, 10),
    end: at(18, 12),
    location: 'Room 2',
  },
  {
    id: 'interview',
    title: 'Interview: AP analyst',
    start: at(18, 11),
    end: at(18, 12),
    tone: 'accent',
  },
  {
    id: 'expenses',
    title: 'Expense approvals',
    start: at(18, 11, 30),
    end: at(18, 12, 30),
    tone: 'positive',
  },
  {
    id: 'payroll',
    title: 'Payroll sign-off',
    start: at(18, 15),
    end: at(18, 16),
    tone: 'negative',
  },
  { id: 'kickoff', title: 'Audit kickoff', start: at(19, 9, 30), end: at(19, 11), tone: 'warning' },
  { id: 'fx', title: 'FX hedging review', start: at(19, 14), end: at(19, 15, 30) },
  {
    id: 'retro',
    title: 'Close retro',
    start: at(20, 15),
    end: at(20, 16),
    tone: 'accent',
    status: 'tentative',
  },
];

/** Shared by the plain and motion demos: the state an app would hold. */
export function useWeekAgendaDemo(): WeekAgendaProps {
  const [date, setDate] = useState(NOW);
  const [variant, setVariant] = useState<AgendaVariant>('week');
  const [events, setEvents] = useState(EVENTS);
  return {
    events,
    date,
    onDateChange: setDate,
    variant,
    onVariantChange: setVariant,
    now: NOW,
    locale: 'en-GB',
    onEventClick: () => undefined,
    onSlotClick: ({ start, end }) => {
      setEvents((list) => [
        ...list,
        { id: `new-${String(list.length)}`, title: 'New event', start, end },
      ]);
    },
  };
}

export default function WeekAgendaDemo() {
  const props = useWeekAgendaDemo();
  return (
    <div className="w-full">
      <WeekAgenda {...props} />
    </div>
  );
}

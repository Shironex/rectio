import type { AgendaEvent } from '@rectio/blocks';

/** A fixed week, so screenshots never drift: Monday 16 to Sunday 22 March 2026. */
export const NOW = new Date(2026, 2, 18, 11, 40);

const at = (day: number, hour: number, minute = 0) => new Date(2026, 2, day, hour, minute);

const INES = { name: 'Ines Duarte' };
const CALLUM = { name: 'Callum Ross' };
const PRIYA = { name: 'Priya Raman' };
const AIYANA = { name: 'Aiyana Brooks' };
const TOMASZ = { name: 'Tomasz Wiśniewski' };
const NOOR = { name: 'Noor Haddad' };

/** A finance team's week: the close, a payment run, an audit visit and the usual standups. */
export const WEEK: AgendaEvent[] = [
  {
    id: 'close',
    title: 'March close',
    start: at(16, 0),
    end: at(19, 0),
    allDay: true,
    tone: 'neutral',
  },
  {
    id: 'audit',
    title: 'Auditors on site',
    start: at(19, 0),
    end: at(21, 0),
    allDay: true,
    tone: 'warning',
    location: 'Floor 3',
  },
  ...[16, 17, 18, 19, 20].map((day) => ({
    id: `standup-${String(day)}`,
    title: 'Finance standup',
    start: at(day, 9),
    end: at(day, 9, 15),
    tone: 'info' as const,
    location: 'Call',
    attendees: [INES, CALLUM, PRIYA, AIYANA],
  })),
  {
    id: 'accruals',
    title: 'Accruals review',
    start: at(16, 10),
    end: at(16, 11, 30),
    location: 'Room 4',
    attendees: [INES, PRIYA],
  },
  {
    id: 'bank',
    title: 'Bank reconciliation',
    start: at(16, 10, 30),
    end: at(16, 12),
    tone: 'positive',
    attendees: [CALLUM],
  },
  {
    id: 'vendor',
    title: 'Vendor call: Halden Freight',
    start: at(16, 14),
    end: at(16, 14, 30),
    status: 'cancelled',
    location: 'Call',
  },
  {
    id: 'payments',
    title: 'Supplier payment run',
    start: at(17, 11),
    end: at(17, 12, 30),
    tone: 'positive',
    location: 'Treasury desk',
    attendees: [CALLUM, TOMASZ],
  },
  {
    id: 'budget',
    title: 'Q2 budget draft',
    start: at(17, 13, 30),
    end: at(17, 16),
    attendees: [AIYANA, NOOR, INES],
  },
  {
    id: 'tax',
    title: 'VAT return check',
    start: at(17, 14),
    end: at(17, 15),
    tone: 'warning',
    status: 'tentative',
    attendees: [PRIYA],
  },
  {
    id: 'board',
    title: 'Board pack: cash section',
    start: at(18, 10),
    end: at(18, 12),
    location: 'Room 2',
    attendees: [INES, NOOR],
  },
  {
    id: 'interview',
    title: 'Interview: AP analyst',
    start: at(18, 11),
    end: at(18, 12),
    tone: 'info',
    location: 'Room 1',
    attendees: [AIYANA, TOMASZ],
  },
  {
    id: 'expenses',
    title: 'Expense approvals',
    start: at(18, 11, 30),
    end: at(18, 12, 30),
    tone: 'neutral',
    attendees: [CALLUM],
  },
  {
    id: 'payroll',
    title: 'Payroll sign-off',
    start: at(18, 15),
    end: at(18, 16),
    tone: 'negative',
    location: 'Room 4',
    attendees: [INES, PRIYA, NOOR],
  },
  {
    id: 'audit-kickoff',
    title: 'Audit kickoff',
    start: at(19, 9, 30),
    end: at(19, 11),
    tone: 'warning',
    location: 'Floor 3',
    attendees: [INES, CALLUM, PRIYA, AIYANA, NOOR],
  },
  {
    id: 'fx',
    title: 'FX hedging review',
    start: at(19, 14),
    end: at(19, 15, 30),
    attendees: [TOMASZ, CALLUM],
  },
  {
    id: 'retro',
    title: 'Close retro',
    start: at(20, 15),
    end: at(20, 16),
    tone: 'info',
    status: 'tentative',
    attendees: [INES, CALLUM, PRIYA],
  },
  {
    id: 'early',
    title: 'Treasury cut-off',
    start: at(20, 7, 30),
    end: at(20, 8, 30),
    tone: 'negative',
  },
];

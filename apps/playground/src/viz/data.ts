/** Steady figures for the analytics view, so every visit draws the same shapes. */

function wobble(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** A trial funnel for a B2B SaaS product, last 30 days. */
export const TRIAL_FUNNEL = [
  { id: 'visits', label: 'Site visits', value: 48210 },
  { id: 'signups', label: 'Sign-ups', value: 6120 },
  { id: 'activated', label: 'Activated', value: 3340 },
  { id: 'trials', label: 'Trial started', value: 2140 },
  { id: 'paid', label: 'Paid', value: 612 },
];

/** The same funnel in the 30 days before, for the funnel card's change. */
export const TRIAL_FUNNEL_BEFORE = [
  { id: 'visits', label: 'Site visits', value: 44870 },
  { id: 'signups', label: 'Sign-ups', value: 5610 },
  { id: 'activated', label: 'Activated', value: 2930 },
  { id: 'trials', label: 'Trial started', value: 1980 },
  { id: 'paid', label: 'Paid', value: 541 },
];

/** An invoice collection funnel, in euros. */
export const COLLECTION_FUNNEL = [
  { id: 'issued', label: 'Issued', value: 1284300 },
  { id: 'viewed', label: 'Viewed', value: 1102800 },
  { id: 'due', label: 'Reached due date', value: 642100 },
  { id: 'paid', label: 'Paid on time', value: 498700 },
];

const firstDay = new Date(2025, 10, 24);

/** Deploys per day over a year, quiet at weekends, a holiday freeze and a few days with no data. */
export const DEPLOYS = Array.from({ length: 364 }, (_, day) => {
  const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + day);
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  const freeze = date.getMonth() === 11 && date.getDate() >= 22;
  const missing = day >= 151 && day <= 153;
  const busy = 0.6 + day / 364;
  const value =
    weekend || freeze ? (wobble(day) > 0.8 ? 1 : 0) : Math.round(wobble(day + 7) * 11 * busy);
  return { date, value: missing ? null : value };
});

/** Monthly logo retention by sign-up cohort, as fractions. */
const COHORTS = ['Jun 2026', 'Jul 2026', 'Aug 2026', 'Sept 2026', 'Oct 2026', 'Nov 2026'];
export const RETENTION_ROWS = COHORTS.map((label, index) => ({ id: `c${String(index)}`, label }));
export const RETENTION_COLUMNS = Array.from({ length: 6 }, (_, month) => ({
  id: `m${String(month)}`,
  label: `Month ${String(month)}`,
}));
const RETAIN = [1, 0.712, 0.618, 0.574, 0.541, 0.522];
export const RETENTION = RETENTION_ROWS.flatMap((row, r) =>
  RETENTION_COLUMNS.slice(0, 6 - r).map((column, c) => ({
    row: row.id,
    column: column.id,
    // The newest cohort's latest month is still being counted.
    value:
      r === 2 && c === 2
        ? null
        : Math.round(((RETAIN[c] ?? 0.5) + (wobble(r * 7 + c) - 0.5) * 0.06) * 1000) / 1000,
  })),
).map((cell) => (cell.column === 'm0' ? { ...cell, value: 1 } : cell));

/** Support tickets opened by weekday and two-hour slot. */
const SLOTS = ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const TICKET_ROWS = WEEKDAYS.map((label) => ({ id: label.toLowerCase(), label }));
export const TICKET_COLUMNS = SLOTS.map((label) => ({ id: label, label }));
export const TICKETS_BY_HOUR = TICKET_ROWS.flatMap((row, r) =>
  TICKET_COLUMNS.map((column, c) => ({
    row: row.id,
    column: column.id,
    value:
      r >= 5
        ? c === 0 || c === 5
          ? 0
          : Math.round(wobble(r + c) * 6)
        : Math.max(
            0,
            Math.round((12 + c * 6 - Math.abs(c - 2) * 7) * (1 - r * 0.07) + wobble(r * 3 + c) * 9),
          ),
  })),
);

/** The quarter's cash bridge, in euros. */
export const CASH_BRIDGE = [
  { id: 'open', label: 'Opening cash', value: 412800, kind: 'start' as const },
  { id: 'receipts', label: 'Customer receipts', value: 286400 },
  { id: 'payroll', label: 'Payroll', value: -198300 },
  { id: 'software', label: 'Software', value: -41200 },
  { id: 'rent', label: 'Rent', value: -24000 },
  { id: 'operating', label: 'After operations', kind: 'subtotal' as const },
  { id: 'tax', label: 'VAT paid', value: -18600 },
  { id: 'loan', label: 'Loan repayment', value: -12000 },
  { id: 'close', label: 'Closing cash', kind: 'end' as const },
];

/** Annual recurring revenue, start of the year to now, in euros. */
export const ARR_BRIDGE = [
  { id: 'start', label: 'ARR 1 Jan', value: 2410000, kind: 'start' as const },
  { id: 'new', label: 'New', value: 382000 },
  { id: 'expansion', label: 'Expansion', value: 142500 },
  { id: 'contraction', label: 'Contraction', value: -58300 },
  { id: 'churn', label: 'Churn', value: -121400 },
  { id: 'end', label: 'ARR today', kind: 'end' as const },
];

export const QUOTA_BANDS = [
  { to: 0.7, label: 'Behind' },
  { to: 0.95, label: 'Close' },
  { to: 1.25, label: 'Ahead' },
];

/** Monthly recurring revenue at the start of each week, last 6 months, in euros. */
const weekOne = new Date(2026, 4, 25);
export const MRR_WEEKLY = Array.from({ length: 26 }, (_, week) => ({
  date: new Date(weekOne.getFullYear(), weekOne.getMonth(), weekOne.getDate() + week * 7),
  value: Math.round(38200 + week * 410 + Math.sin(week / 2.4) * 900 + wobble(week) * 600),
}));

/** Monthly churn as a fraction, last 12 months. */
export const CHURN = Array.from({ length: 12 }, (_, month) => ({
  date: new Date(2025, 11 + month, 1),
  value: Math.round((0.031 - month * 0.0009 + (wobble(month + 3) - 0.5) * 0.004) * 10000) / 10000,
}));

/** Active workspaces each day, last 30 days. */
export const ACTIVE_WORKSPACES = Array.from({ length: 30 }, (_, day) => ({
  date: new Date(2026, 9, 23 + day),
  value: Math.round(1840 + day * 6 + (day % 7 >= 5 ? -260 : 0) + wobble(day + 11) * 80),
}));

/** Revenue by acquisition channel this month, with last month, in euros. */
export const REVENUE_BY_CHANNEL = [
  { id: 'organic', label: 'Organic search', value: 42180, previous: 38940 },
  { id: 'direct', label: 'Direct', value: 31260, previous: 32100 },
  { id: 'partners', label: 'Partners', value: 18420, previous: 14980 },
  { id: 'paid-search', label: 'Paid search', value: 12890, previous: 13870 },
  { id: 'referral', label: 'Customer referral', value: 9640, previous: 7210 },
  { id: 'social', label: 'Social', value: 4210, previous: 4630 },
  { id: 'events', label: 'Events', value: 2980, previous: 0 },
  { id: 'newsletter', label: 'Newsletter', value: 1870, previous: 1640 },
  { id: 'marketplace', label: 'App marketplace', value: 1240, previous: 980 },
  { id: 'affiliates', label: 'Affiliates', value: 610, previous: 720 },
];

/** Operating spend by vendor this quarter, in euros. */
export const SPEND_BY_VENDOR = [
  { id: 'aws', label: 'Cloud hosting', value: 61200, previous: 55800 },
  { id: 'payroll', label: 'Payroll software', value: 8400, previous: 8400 },
  { id: 'crm', label: 'CRM', value: 14100, previous: 12900 },
  { id: 'design', label: 'Design tools', value: 3600, previous: 3900 },
  { id: 'support', label: 'Support desk', value: 6900, previous: 6100 },
];

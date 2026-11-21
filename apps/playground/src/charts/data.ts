/** Steady, seeded figures for the charts view, so every screenshot round draws the same shapes. */

/** A small deterministic noise: the same seed always gives the same wobble. */
function wobble(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const START = new Date(2026, 7, 24);

const dayAt = (offset: number) =>
  new Date(START.getFullYear(), START.getMonth(), START.getDate() + offset);

/** Daily revenue over 90 days: a slow climb, weekday rhythm and a quiet start to September. */
export const REVENUE = Array.from({ length: 90 }, (_, day) => {
  const date = dayAt(day);
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  const trend = 1480 + day * 9.5;
  const value = Math.round(trend * (weekend ? 0.62 : 1) + (wobble(day) - 0.5) * 260);
  return { date, value };
});

/** Weekly active users, this quarter against the same weeks last quarter. */
export const ACTIVE_USERS = [
  {
    id: 'this',
    label: 'This quarter',
    points: Array.from({ length: 13 }, (_, week) => ({
      date: dayAt(week * 7),
      value: Math.round(3120 + week * 84 + (wobble(week + 40) - 0.5) * 220),
    })),
  },
  {
    id: 'last',
    label: 'Last quarter',
    dashed: true,
    points: Array.from({ length: 13 }, (_, week) => ({
      date: dayAt(week * 7),
      value: Math.round(2890 + week * 52 + (wobble(week + 90) - 0.5) * 180),
    })),
  },
];

/** Daily signups with a broken import: a week of missing days in the middle. */
export const SIGNUPS = [
  {
    id: 'signups',
    label: 'Signups',
    points: Array.from({ length: 42 }, (_, day) => ({
      date: dayAt(day),
      value: Math.round(64 + day * 0.9 + (wobble(day + 7) - 0.5) * 22),
    })).filter((_, day) => day < 17 || day > 24),
  },
];

/** Response time against a target, by hour over two days. */
export const RESPONSE = [
  {
    id: 'p95',
    label: 'p95 response',
    points: Array.from({ length: 48 }, (_, hour) => ({
      date: new Date(2026, 10, 19, hour),
      value: Math.round(210 + Math.sin((hour / 24) * Math.PI * 2 - 1.2) * 60 + wobble(hour) * 30),
    })),
  },
];

// Written as the en-GB date axis writes them, so bars and lines name months alike.
const MONTHS = ['Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov'];

/** Monthly recurring revenue by plan, stacked into the month's total. */
export const MRR = MONTHS.map((month, index) => ({
  month,
  starter: 8200 + index * 410,
  team: 21400 + index * 1650,
  enterprise: 30500 + index * 2300 + (index === 3 ? 4100 : 0),
}));

/** The same months, nudged, for the update transition. */
export const MRR_NEXT = MRR.map((row, index) => ({
  ...row,
  starter: row.starter + 300 - index * 40,
  team: row.team + (index % 2 === 0 ? 1900 : -800),
  enterprise: row.enterprise + 1200 * (index % 3),
}));

/** Open tickets by team, ranked, for horizontal bars. */
export const TICKETS = [
  { team: 'Payments and invoicing', open: 42 },
  { team: 'Onboarding', open: 31 },
  { team: 'Bank feeds', open: 27 },
  { team: 'Expense approvals', open: 18 },
  { team: 'Reporting', open: 11 },
  { team: 'Mobile app', open: 6 },
];

/** Net cash by month, for bars on both sides of zero. */
export const NET_CASH = MONTHS.map((month, index) => ({
  month,
  net: [18400, -6200, 9100, -12800, 4300, 15600][index] ?? 0,
}));

/** Operating spend by category, more parts than the ring draws. */
export const SPEND = [
  { id: 'payroll', label: 'Payroll', value: 184200 },
  { id: 'software', label: 'Software', value: 42800 },
  { id: 'office', label: 'Office and rent', value: 31500 },
  { id: 'travel', label: 'Travel', value: 9400 },
  { id: 'marketing', label: 'Marketing', value: 7700 },
];

/** Plan mix of active accounts, three parts. */
export const PLAN_MIX = [
  { id: 'starter', label: 'Starter', value: 1284 },
  { id: 'team', label: 'Team', value: 642 },
  { id: 'enterprise', label: 'Enterprise', value: 96 },
];

/** Recent periods for the stat row's sparklines, oldest first. */
export const STATS = [
  {
    label: 'Net revenue',
    value: '€214,380',
    money: true,
    change: 0.084,
    better: 'up' as const,
    data: [162, 171, 168, 180, 176, 189, 194, 201, 198, 207, 211, 214],
  },
  {
    label: 'Churn',
    value: '2.4%',
    change: 0.003,
    format: 'points' as const,
    better: 'down' as const,
    data: [2.1, 2.0, 2.2, 2.1, 2.3, 2.2, 2.1, 2.3, 2.4, 2.2, 2.3, 2.4],
  },
  {
    label: 'Days sales outstanding',
    value: '38 days',
    change: -0.061,
    better: 'down' as const,
    data: [44, 43, 45, 42, 41, 42, 40, 39, 41, 39, 38, 38],
  },
  {
    label: 'Open approvals',
    value: '17',
    change: 0,
    better: 'none' as const,
    data: [15, 18, 16, 16, 19, 17, null, 18, 17, 16, 18, 17],
  },
];

/** Invoiced against collected by month, for grouped bars. */
export const CASHFLOW = MONTHS.map((month, index) => ({
  month,
  invoiced: [52400, 48900, 57100, 61800, 59300, 66200][index] ?? 0,
  collected: [47800, 50200, 51900, 58400, 60100, 61700][index] ?? 0,
}));

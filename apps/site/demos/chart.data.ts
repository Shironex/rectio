/** Steady figures for the chart demos, so every visit draws the same shapes. */

function wobble(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const dayAt = (offset: number) => new Date(2026, 7, 24 + offset);

/** Daily revenue over 90 days, with a weekday rhythm. */
export const REVENUE = Array.from({ length: 90 }, (_, day) => {
  const date = dayAt(day);
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  return {
    date,
    value: Math.round((1480 + day * 9.5) * (weekend ? 0.62 : 1) + (wobble(day) - 0.5) * 260),
  };
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

/** Signups by plan, by week, for a stacked area. */
const PLAN_BASE = [120, 54, 9];

export const SIGNUPS_BY_PLAN = ['Starter', 'Team', 'Enterprise'].map((label, index) => ({
  id: label.toLowerCase(),
  label,
  points: Array.from({ length: 16 }, (_, week) => ({
    date: dayAt(week * 7),
    value: Math.round(
      (PLAN_BASE[index] ?? 0) * (1 + week * 0.03) + (wobble(week + index * 30) - 0.5) * 18,
    ),
  })),
}));

const MONTHS = ['Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov'];

/** Monthly recurring revenue by plan. */
export const MRR = MONTHS.map((month, index) => ({
  month,
  starter: 8200 + index * 410,
  team: 21400 + index * 1650,
  enterprise: 30500 + index * 2300,
}));

/** Invoiced against collected by month. */
export const CASHFLOW = MONTHS.map((month, index) => ({
  month,
  invoiced: [52400, 48900, 57100, 61800, 59300, 66200][index] ?? 0,
  collected: [47800, 50200, 51900, 58400, 60100, 61700][index] ?? 0,
}));

/** Open tickets by team, ranked. */
export const TICKETS = [
  { team: 'Payments and invoicing', open: 42 },
  { team: 'Onboarding', open: 31 },
  { team: 'Bank feeds', open: 27 },
  { team: 'Expense approvals', open: 18 },
  { team: 'Reporting', open: 11 },
];

/** Operating spend by category, more parts than the ring draws. */
export const SPEND = [
  { id: 'payroll', label: 'Payroll', value: 184200 },
  { id: 'software', label: 'Software', value: 42800 },
  { id: 'office', label: 'Office and rent', value: 31500 },
  { id: 'travel', label: 'Travel', value: 9400 },
  { id: 'marketing', label: 'Marketing', value: 7700 },
];

/** Plan mix of active accounts. */
export const PLAN_MIX = [
  { id: 'starter', label: 'Starter', value: 1284 },
  { id: 'team', label: 'Team', value: 642 },
  { id: 'enterprise', label: 'Enterprise', value: 96 },
];

export const TREND = [162, 171, 168, 180, 176, 189, 194, 201, 198, 207, 211, 214];

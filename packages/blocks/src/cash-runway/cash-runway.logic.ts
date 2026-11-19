import { fromMinor, toMinor } from '../lib/finance';

export interface RunwayMonth {
  /** First day of the month the figures cover. */
  month: Date;
  /** Cash received, major units, zero or more. */
  inflow: number;
  /** Cash paid out, as a positive amount. */
  outflow: number;
}

/** A known one-off ahead, such as a funding round (positive) or an annual licence (negative). */
export interface PlannedChange {
  /** Any day in the month it lands. */
  month: Date;
  amount: number;
  label: string;
}

export interface Burn {
  /** Average monthly net outflow over the window: positive when cash is shrinking. */
  burn: number;
  /** Average monthly net flow (inflow less outflow), the same figure with the opposite sign. */
  net: number;
  /** How many months the average covers; fewer than asked when the history is short. */
  months: number;
}

const monthKey = (date: Date) => date.getFullYear() * 12 + date.getMonth();
const fromKey = (key: number) => new Date(Math.floor(key / 12), key % 12, 1);

/** The history in month order, one entry per month (repeated months summed), in minor units. */
function monthlyNets(history: readonly RunwayMonth[], currency: string) {
  const months = new Map<number, number>();
  for (const entry of history) {
    const key = monthKey(entry.month);
    months.set(
      key,
      (months.get(key) ?? 0) + toMinor(entry.inflow, currency) - toMinor(entry.outflow, currency),
    );
  }
  return [...months].sort(([a], [b]) => a - b);
}

/** Average burn over the last `window` months of history, exact to the minor unit. */
export function averageBurn(history: readonly RunwayMonth[], currency: string, window = 3): Burn {
  const recent = monthlyNets(history, currency).slice(-Math.max(1, window));
  if (recent.length === 0) return { burn: 0, net: 0, months: 0 };
  const total = recent.reduce((sum, [, net]) => sum + net, 0);
  const average = Math.round(total / recent.length);
  return {
    burn: fromMinor(-average, currency),
    net: fromMinor(average, currency),
    months: recent.length,
  };
}

export interface BalancePoint {
  key: string;
  /** First day of the month; the balance is the one at its end. */
  month: Date;
  balance: number;
  kind: 'actual' | 'projected';
  /** The planned changes that land in a projected month. */
  planned: PlannedChange[];
}

export interface Runway {
  burn: Burn;
  /**
   * Months until cash reaches zero, with a fraction for the part month (balance divided by burn
   * when nothing is planned). Null when cash is not shrinking, or when it lasts past the horizon.
   */
  months: number | null;
  status: 'burning' | 'not-burning' | 'beyond-horizon';
  /** The month the projected balance first reaches zero or less; null when it never does. */
  zeroMonth: Date | null;
  /** The month the projected balance first drops below `threshold`; null when it never does. */
  thresholdMonth: Date | null;
  /** Month-end balances: history worked back from today's balance, then the projection. */
  series: BalancePoint[];
}

export interface RunwayOptions {
  /** The months the burn is averaged over. */
  window?: number;
  /** Cash you do not want to go below. */
  threshold?: number | undefined;
  planned?: readonly PlannedChange[];
  /** How many months the projection may run at most. */
  horizon?: number;
}

const pointKey = (date: Date) =>
  `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/**
 * Runway from today's balance and the average burn: the history's month-end balances worked back
 * from the balance at the end of its last month, then a projection that spends the average burn
 * each month, adds what is planned, and stops at the month cash runs out (or at `horizon`).
 */
export function cashRunway(
  history: readonly RunwayMonth[],
  balance: number,
  currency: string,
  { window = 3, threshold, planned = [], horizon = 36 }: RunwayOptions = {},
): Runway {
  const nets = monthlyNets(history, currency);
  const burn = averageBurn(history, currency, window);
  const series: BalancePoint[] = [];

  // Work back: the balance at the end of each month is the next month's end less its net.
  let end = toMinor(balance, currency);
  const actual: BalancePoint[] = [];
  for (let index = nets.length - 1; index >= 0; index -= 1) {
    const [key, net] = nets[index] ?? [0, 0];
    const month = fromKey(key);
    actual.unshift({
      key: pointKey(month),
      month,
      balance: fromMinor(end, currency),
      kind: 'actual',
      planned: [],
    });
    end -= net;
  }
  series.push(...actual);

  const burnMinor = toMinor(burn.burn, currency);
  const plannedByMonth = new Map<number, PlannedChange[]>();
  for (const change of planned) {
    const key = monthKey(change.month);
    plannedByMonth.set(key, [...(plannedByMonth.get(key) ?? []), change]);
  }
  const hasPlanned = planned.length > 0;
  const thresholdMinor = threshold === undefined ? undefined : toMinor(threshold, currency);

  let zeroMonth: Date | null = null;
  let thresholdMonth: Date | null = null;
  let months: number | null = null;
  const start = toMinor(balance, currency);
  if (thresholdMinor !== undefined && start < thresholdMinor && nets.length > 0) {
    thresholdMonth = fromKey(nets.at(-1)?.[0] ?? 0);
  }

  // Project only while cash shrinks or something is planned; a growing balance needs no forecast.
  if (burnMinor > 0 || hasPlanned) {
    const lastKey = nets.at(-1)?.[0] ?? monthKey(new Date());
    let running = start;
    for (let step = 1; step <= horizon; step += 1) {
      const key = lastKey + step;
      const changes = plannedByMonth.get(key) ?? [];
      const before = running;
      running += -burnMinor + changes.reduce((sum, c) => sum + toMinor(c.amount, currency), 0);
      const month = fromKey(key);
      series.push({
        key: pointKey(month),
        month,
        balance: fromMinor(running, currency),
        kind: 'projected',
        planned: changes,
      });
      if (thresholdMonth === null && thresholdMinor !== undefined && running < thresholdMinor) {
        thresholdMonth = month;
      }
      if (running <= 0) {
        zeroMonth = month;
        // The part of this month the balance lasted, read off a straight line between month ends.
        const spent = before - running;
        months = step - 1 + (spent > 0 && before > 0 ? before / spent : 0);
        break;
      }
      // With nothing planned past this month, a balance that is not shrinking never runs out.
      if (burnMinor <= 0 && ![...plannedByMonth.keys()].some((k) => k > key)) break;
    }
  }

  const status = zeroMonth !== null ? 'burning' : burnMinor > 0 ? 'beyond-horizon' : 'not-burning';
  return { burn, months, status, zeroMonth, thresholdMonth, series };
}

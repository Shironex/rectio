import { fromMinor, toMinor } from '../lib/finance';

export interface CashFlowPoint {
  /** First day of the month the figures cover. */
  month: Date;
  /** Cash received, major units, zero or more. */
  inflow: number;
  /** Cash paid out, as a positive amount. */
  outflow: number;
}

export type Granularity = 'month' | 'quarter';

export interface CashFlowPeriod {
  key: string;
  start: Date;
  inflow: number;
  outflow: number;
  /** Inflow minus outflow. */
  net: number;
}

function periodKey(date: Date, granularity: Granularity): string {
  const year = date.getFullYear();
  return granularity === 'month'
    ? `${String(year)}-${String(date.getMonth() + 1).padStart(2, '0')}`
    : `${String(year)}-Q${String(Math.floor(date.getMonth() / 3) + 1)}`;
}

/** Months summed into months or quarters, in date order, exact to the minor unit. */
export function aggregateCashFlow(
  points: readonly CashFlowPoint[],
  granularity: Granularity,
  currency: string,
): CashFlowPeriod[] {
  const periods = new Map<string, { start: Date; inflow: number; outflow: number }>();
  for (const point of points) {
    const key = periodKey(point.month, granularity);
    const start =
      granularity === 'month'
        ? new Date(point.month.getFullYear(), point.month.getMonth(), 1)
        : new Date(
            point.month.getFullYear(),
            point.month.getMonth() - (point.month.getMonth() % 3),
            1,
          );
    const period = periods.get(key) ?? { start, inflow: 0, outflow: 0 };
    period.inflow += toMinor(point.inflow, currency);
    period.outflow += toMinor(point.outflow, currency);
    periods.set(key, period);
  }
  return [...periods]
    .sort(([, a], [, b]) => a.start.getTime() - b.start.getTime())
    .map(([key, p]) => ({
      key,
      start: p.start,
      inflow: fromMinor(p.inflow, currency),
      outflow: fromMinor(p.outflow, currency),
      net: fromMinor(p.inflow - p.outflow, currency),
    }));
}

export interface CashFlowSummary {
  inflow: number;
  outflow: number;
  net: number;
  /** Periods where more came in than went out. */
  positive: number;
}

export function summarizeCashFlow(
  periods: readonly CashFlowPeriod[],
  currency: string,
): CashFlowSummary {
  let inflow = 0;
  let outflow = 0;
  for (const p of periods) {
    inflow += toMinor(p.inflow, currency);
    outflow += toMinor(p.outflow, currency);
  }
  return {
    inflow: fromMinor(inflow, currency),
    outflow: fromMinor(outflow, currency),
    net: fromMinor(inflow - outflow, currency),
    positive: periods.filter((p) => p.net > 0).length,
  };
}

/** "Mar 2026" or "Q1 2026" in the reader's language. */
export function periodLabel(
  period: Pick<CashFlowPeriod, 'start'>,
  granularity: Granularity,
  locale: string | undefined,
  short = false,
): string {
  if (granularity === 'quarter') {
    const quarter = Math.floor(period.start.getMonth() / 3) + 1;
    const year = String(period.start.getFullYear());
    return short ? `Q${String(quarter)} ${year.slice(2)}` : `Q${String(quarter)} ${year}`;
  }
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    ...(short ? {} : { year: 'numeric' }),
  }).format(period.start);
}

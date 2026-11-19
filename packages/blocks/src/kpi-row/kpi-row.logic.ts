import { relativeChange } from '../lib/finance';

export interface Kpi {
  id: string;
  label: string;
  /** This period's figure: an amount in major units, or a fraction for `percent` (0.24 is 24%). */
  value: number;
  /** The same figure for the period compared against. */
  previous: number;
  format: 'money' | 'percent';
  /** Which way is good news: up for revenue and margin, down for expenses. */
  better: 'up' | 'down';
  /** Recent periods, oldest first, ending with `value`. Drawn as a sparkline. */
  series: readonly number[];
}

export type Direction = 'up' | 'down' | 'flat';

export interface KpiDelta {
  direction: Direction;
  /**
   * For money, the relative change (0.042 is 4.2%), null when the previous figure was zero. For
   * percentages, the change in percentage points as a fraction (0.021 is 2.1 points).
   */
  change: number | null;
  /** True when the move is in the `better` direction; null when flat. */
  favourable: boolean | null;
}

/** Changes smaller than this read as flat: half a basis point. */
const FLAT = 0.00005;

export function kpiDelta(kpi: Kpi): KpiDelta {
  const change =
    kpi.format === 'percent' ? kpi.value - kpi.previous : relativeChange(kpi.value, kpi.previous);
  const raw = kpi.value - kpi.previous;
  const direction: Direction =
    change !== null && Math.abs(change) < FLAT
      ? 'flat'
      : raw > 0
        ? 'up'
        : raw < 0
          ? 'down'
          : 'flat';
  return {
    direction,
    change,
    favourable: direction === 'flat' ? null : direction === kpi.better,
  };
}

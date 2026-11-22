// No 'use client': these run in a server component as well as in the chart.

/**
 * A step of a waterfall. `start` opens at its figure; `delta` (the default) moves the running total
 * by its figure; `subtotal` and `end` stand from zero to the running total, and their `value` is
 * ignored, so they always add up.
 */
export interface WaterfallStep {
  id: string;
  label: string;
  value?: number | undefined;
  kind?: 'start' | 'delta' | 'subtotal' | 'end' | undefined;
}

export type WaterfallRole = 'total' | 'increase' | 'decrease';

/** A step placed on the value axis: where its bar starts and ends, and the total after it. */
export interface WaterfallBar {
  id: string;
  label: string;
  kind: NonNullable<WaterfallStep['kind']>;
  role: WaterfallRole;
  /** The step's own figure: the change for a delta, the amount for a total. */
  value: number;
  /** The running total after this step. */
  running: number;
  /** The bar's two ends on the value axis, low first. */
  range: [number, number];
}

/** Lays the steps out on the value axis, keeping the running total. */
export function waterfallBars(steps: readonly WaterfallStep[]): WaterfallBar[] {
  let running = 0;
  return steps.map((step) => {
    const kind = step.kind ?? 'delta';
    const figure = Number.isFinite(step.value) ? (step.value ?? 0) : 0;
    if (kind === 'start') {
      running = figure;
      return {
        id: step.id,
        label: step.label,
        kind,
        role: 'total',
        value: figure,
        running,
        range: [Math.min(0, figure), Math.max(0, figure)],
      };
    }
    if (kind === 'subtotal' || kind === 'end') {
      return {
        id: step.id,
        label: step.label,
        kind,
        role: 'total',
        value: running,
        running,
        range: [Math.min(0, running), Math.max(0, running)],
      };
    }
    const from = running;
    running += figure;
    return {
      id: step.id,
      label: step.label,
      kind,
      role: figure < 0 ? 'decrease' : 'increase',
      value: figure,
      running,
      range: [Math.min(from, running), Math.max(from, running)],
    };
  });
}

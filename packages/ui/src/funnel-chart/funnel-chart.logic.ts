// No 'use client': these run in a server component as well as in the chart.

export interface FunnelStage {
  /** Stable key for the stage. */
  id: string;
  label: string;
  /** How many reached this stage. Negative figures count as zero. */
  value: number;
}

/** One stage with what it kept from the stage before and from the first. */
export interface FunnelStep {
  id: string;
  label: string;
  value: number;
  /** Its share of the first stage, 0 to 1 (more when a stage outgrows the first). */
  ofFirst: number;
  /** Its share of the stage before; 1 for the first stage, null after an empty stage. */
  ofPrevious: number | null;
  /** How many left between the stage before and this one; 0 for the first, negative when it grew. */
  dropped: number;
  /** The stage before's length as a share of the longest stage, where the drop-off band ends. */
  previousLength: number;
  /** This stage's length as a share of the longest stage. */
  length: number;
}

/**
 * The stages with their conversion and drop-off. Lengths are shares of the longest stage, so a
 * stage that grows past the first still fits; conversion is always against the stage before.
 */
export function funnelSteps(data: readonly FunnelStage[]): FunnelStep[] {
  const values = data.map((stage) => (Number.isFinite(stage.value) ? Math.max(0, stage.value) : 0));
  const first = values[0] ?? 0;
  const longest = Math.max(0, ...values);
  const length = (value: number) => (longest === 0 ? 0 : value / longest);
  return data.map((stage, index) => {
    const value = values[index] ?? 0;
    const previous = index === 0 ? value : (values[index - 1] ?? 0);
    return {
      id: stage.id,
      label: stage.label,
      value,
      ofFirst: first === 0 ? 0 : value / first,
      ofPrevious: index === 0 ? 1 : previous === 0 ? null : value / previous,
      dropped: previous - value,
      previousLength: length(previous),
      length: length(value),
    };
  });
}

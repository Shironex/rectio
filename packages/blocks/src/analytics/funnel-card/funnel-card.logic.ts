import { funnelSteps, type FunnelStage } from '@rectio/ui/charts';

export interface FunnelInsight {
  /**
   * The share of the first stage that reached the last, with the figures the chart draws (a
   * negative or missing figure counts as zero). Null when the first stage is empty: unknown, not 0.
   */
  conversion: number | null;
  /** The same for the funnel before, when given. */
  previousConversion: number | null;
  /** The change in conversion, in points as a fraction (0.012 is 1.2 points); null if either is unknown. */
  change: number | null;
  /** The step that lost the largest share of the stage before it. */
  biggestDrop: { label: string; from: string; lost: number } | null;
}

/** The end to end conversion of the stages as the chart sanitises them; null with no first stage. */
function conversionOf(stages: readonly FunnelStage[]): number | null {
  const steps = funnelSteps(stages);
  const first = steps[0]?.value ?? 0;
  return first > 0 ? (steps.at(-1)?.ofFirst ?? null) : null;
}

/** What a funnel card says above its chart: the overall conversion, its change and the worst step. */
export function funnelInsight(
  stages: readonly FunnelStage[],
  previous?: readonly FunnelStage[],
): FunnelInsight {
  const conversion = conversionOf(stages);
  const previousConversion = previous === undefined ? null : conversionOf(previous);
  const steps = funnelSteps(stages);
  let biggestDrop: FunnelInsight['biggestDrop'] = null;
  steps.forEach((step, index) => {
    if (index === 0 || step.ofPrevious === null) return;
    const lost = 1 - step.ofPrevious;
    if (lost > 0 && (biggestDrop === null || lost > biggestDrop.lost)) {
      biggestDrop = { label: step.label, from: steps[index - 1]?.label ?? '', lost };
    }
  });
  return {
    conversion,
    previousConversion,
    change:
      conversion === null || previousConversion === null ? null : conversion - previousConversion,
    biggestDrop,
  };
}

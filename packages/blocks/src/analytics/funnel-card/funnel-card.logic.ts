import { funnelSteps, type FunnelStage } from '@rectio/ui/charts';

export interface FunnelInsight {
  /** The share of the first stage that reached the last. */
  conversion: number;
  /** The same for the funnel before, when given. */
  previousConversion: number | null;
  /** The change in conversion, in points as a fraction (0.012 is 1.2 points). */
  change: number | null;
  /** The step that lost the largest share of the stage before it. */
  biggestDrop: { label: string; from: string; lost: number } | null;
}

function conversionOf(stages: readonly FunnelStage[]): number | null {
  const first = stages[0]?.value ?? 0;
  const last = stages.at(-1)?.value ?? 0;
  return first > 0 ? Math.max(0, last) / first : null;
}

/** What a funnel card says above its chart: the overall conversion, its change and the worst step. */
export function funnelInsight(
  stages: readonly FunnelStage[],
  previous?: readonly FunnelStage[],
): FunnelInsight {
  const conversion = conversionOf(stages) ?? 0;
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
      previousConversion === null || stages.length === 0 ? null : conversion - previousConversion,
    biggestDrop,
  };
}

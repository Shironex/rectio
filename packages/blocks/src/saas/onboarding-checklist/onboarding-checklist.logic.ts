export interface OnboardingAction {
  label: string;
  /** Called when the action is pressed. Give this or `href`. */
  onSelect?: () => void;
  /** Where the action goes, rendered as a link. */
  href?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  /** One line on why the step matters or what it takes. */
  description?: string;
  done: boolean;
  /** The button that does the step, such as "Connect your bank". */
  action?: OnboardingAction;
  /** Shown as optional; it still counts toward progress. */
  optional?: boolean;
}

export interface OnboardingProgress {
  done: number;
  total: number;
  /** Whole percent, 0 to 100. */
  percent: number;
  /** The first step not done, in the order given, or null when every step is done. */
  next: OnboardingStep | null;
  complete: boolean;
}

/** How far along a checklist is, and which step to point at next. */
export function onboardingProgress(steps: readonly OnboardingStep[]): OnboardingProgress {
  const done = steps.filter((step) => step.done).length;
  const total = steps.length;
  const next = steps.find((step) => !step.done) ?? null;
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    next,
    complete: total > 0 && done === total,
  };
}

/** "2 of 5 done" or "All 5 done". */
export function onboardingSummary(progress: OnboardingProgress): string {
  if (progress.total === 0) return 'Nothing to set up';
  if (progress.complete) return `All ${String(progress.total)} done`;
  return `${String(progress.done)} of ${String(progress.total)} done`;
}

import { SaasMotionParts } from '../lib/saas-motion-parts';
import {
  OnboardingChecklist as PlainOnboardingChecklist,
  type OnboardingChecklistProps,
} from './onboarding-checklist';

export type { OnboardingChecklistProps };

/** OnboardingChecklist with the motion parts: same props, plain under reduced motion. */
export function OnboardingChecklist(props: OnboardingChecklistProps) {
  return (
    <SaasMotionParts>
      <PlainOnboardingChecklist {...props} />
    </SaasMotionParts>
  );
}

'use client';

import { OnboardingChecklist } from '@rectio/blocks/motion';
import { useState } from 'react';

import { STEPS } from './onboarding-checklist';

export default function OnboardingChecklistMotionDemo() {
  const [steps, setSteps] = useState(STEPS);
  return (
    <div className="w-full">
      <OnboardingChecklist
        steps={steps}
        onToggleStep={(id, done) => {
          setSteps(steps.map((step) => (step.id === id ? { ...step, done } : step)));
        }}
        onDismiss={() => {
          setSteps(STEPS);
        }}
      />
    </div>
  );
}

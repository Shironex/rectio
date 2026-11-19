import {
  OnboardingChecklist as PlainOnboardingChecklist,
  type OnboardingStep,
} from '@rectio/blocks';
import { OnboardingChecklist as MotionOnboardingChecklist } from '@rectio/blocks/motion';
import { useState } from 'react';

import type { DemoProps } from './demo';

const STEPS: OnboardingStep[] = [
  {
    id: 'workspace',
    title: 'Name your workspace',
    description: 'It appears on invoices and in every invite you send.',
    done: true,
    action: { label: 'Name it', onSelect: () => undefined },
  },
  {
    id: 'bank',
    title: 'Connect your bank account',
    description: 'Transactions arrive every morning, ready to match against invoices.',
    done: true,
  },
  {
    id: 'team',
    title: 'Invite your finance team',
    description: 'Approvers and accountants get their own sign in and the right role.',
    done: false,
    action: { label: 'Invite people', onSelect: () => undefined },
  },
  {
    id: 'policy',
    title: 'Set an expense policy',
    description: 'Limits per category, so out-of-policy spend is flagged before approval.',
    done: false,
    action: { label: 'Open policies', onSelect: () => undefined },
  },
  {
    id: 'app',
    title: 'Install the mobile app',
    description: 'Snap receipts as you go; they attach to the right expense.',
    done: false,
    optional: true,
    action: { label: 'Get the app', onSelect: () => undefined },
  },
];

export function OnboardingChecklistDemo({ motion, empty }: DemoProps) {
  const OnboardingChecklist = motion ? MotionOnboardingChecklist : PlainOnboardingChecklist;
  const [steps, setSteps] = useState(
    empty ? STEPS.map((step) => ({ ...step, done: false })) : STEPS,
  );
  return (
    <OnboardingChecklist
      steps={steps}
      estimate="About 10 minutes"
      onToggleStep={(id, done) => {
        setSteps(steps.map((step) => (step.id === id ? { ...step, done } : step)));
      }}
      onDismiss={() => undefined}
    />
  );
}

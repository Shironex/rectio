'use client';

import { OnboardingChecklist, type OnboardingStep } from '@rectio/blocks';
import { useState } from 'react';

export const STEPS: OnboardingStep[] = [
  { id: 'workspace', title: 'Name your workspace', done: true },
  {
    id: 'bank',
    title: 'Connect your bank account',
    description: 'Transactions arrive every morning, ready to match against invoices.',
    done: false,
    action: { label: 'Connect', href: '#connect-bank' },
  },
  {
    id: 'team',
    title: 'Invite your finance team',
    description: 'Approvers and accountants get their own sign in and the right role.',
    done: false,
    action: { label: 'Invite people', href: '#invite' },
  },
  { id: 'app', title: 'Install the mobile app', done: false, optional: true },
];

/** The app knows which steps are done; the checklist shows them and the next one. */
export default function OnboardingChecklistDemo() {
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

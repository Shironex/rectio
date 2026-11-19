'use client';

import { Button, Stepper } from '@rectio/ui';
import { useState } from 'react';

const steps = [
  { title: 'Company', description: 'Legal name and address' },
  { title: 'Bank account', description: 'Connect or add by IBAN' },
  { title: 'Tax settings', description: 'VAT number and rates' },
  { title: 'Invite team', description: 'Approvers and accountants' },
];

export default function StepperDemo() {
  const [current, setCurrent] = useState(2);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <Stepper steps={steps} current={current} label="Account setup" onStepSelect={setCurrent} />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={current === 0}
          onClick={() => {
            setCurrent((c) => Math.max(0, c - 1));
          }}
        >
          Back
        </Button>
        <Button
          size="sm"
          disabled={current === steps.length}
          onClick={() => {
            setCurrent((c) => Math.min(steps.length, c + 1));
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

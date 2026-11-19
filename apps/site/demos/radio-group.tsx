'use client';

import { Field, FieldDescription, Radio, RadioCard, RadioGroup } from '@rectio/ui';
import { useState } from 'react';

const PLANS = [
  { value: 'starter', title: 'Starter', description: 'Up to 3 members, receipts and cards.' },
  { value: 'team', title: 'Team', description: 'Approval flows, audit log, accounting export.' },
  { value: 'scale', title: 'Scale', description: 'SSO, SCIM and custom roles.' },
] as const;

const PRICES = {
  monthly: { starter: 0, team: 12, scale: 24 },
  yearly: { starter: 0, team: 10, scale: 20 },
} as const;

const euros = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export default function RadioGroupDemo() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [plan, setPlan] = useState<string>('team');

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <Field>
        <RadioGroup
          legend="Billing period"
          value={period}
          onValueChange={(value) => {
            setPeriod(value as 'monthly' | 'yearly');
          }}
          className="flex-row flex-wrap gap-x-6"
        >
          <Radio value="monthly">Monthly</Radio>
          <Radio value="yearly" description="Two months free.">
            Yearly
          </Radio>
        </RadioGroup>
      </Field>
      <Field>
        <RadioGroup
          legend="Plan"
          value={plan}
          onValueChange={(value) => {
            setPlan(value as string);
          }}
          className="grid gap-3 sm:grid-cols-3"
        >
          {PLANS.map((p) => (
            <RadioCard
              key={p.value}
              value={p.value}
              title={p.title}
              description={p.description}
              meta={`${euros.format(PRICES[period][p.value])}/mo`}
              className="flex-col"
            />
          ))}
        </RadioGroup>
        <FieldDescription>Per member. Change plans at any time.</FieldDescription>
      </Field>
    </div>
  );
}

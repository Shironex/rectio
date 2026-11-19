'use client';

import { PricingTable, type PricingFeature, type PricingPlan } from '@rectio/blocks';

export const PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For one person getting the books in order.',
    monthly: 0,
    highlights: ['1 seat', '500 workflow runs a month', 'Email support'],
    cta: 'Start for free',
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For teams that close the month together.',
    monthly: 24,
    yearly: 240,
    unit: 'per seat',
    highlights: [
      'Up to 25 seats',
      '10,000 workflow runs a month',
      'Approvals and audit trail',
      'API access',
    ],
    cta: 'Start free trial',
    recommended: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    description: 'For finance teams across entities.',
    monthly: 49,
    yearly: 468,
    unit: 'per seat',
    highlights: [
      'Unlimited seats',
      'Multi-entity consolidation',
      'SSO and SCIM',
      'Priority support',
    ],
  },
];

export const FEATURES: PricingFeature[] = [
  {
    id: 'seats',
    group: 'Workspace',
    label: 'Seats',
    values: { starter: '1', growth: 'Up to 25', scale: 'Unlimited' },
  },
  {
    id: 'runs',
    group: 'Workspace',
    label: 'Workflow runs a month',
    values: { starter: '500', growth: '10,000', scale: '100,000' },
  },
  {
    id: 'approvals',
    group: 'Finance',
    label: 'Approval flows',
    values: { starter: false, growth: true, scale: true },
  },
  {
    id: 'entities',
    group: 'Finance',
    label: 'Multi-entity consolidation',
    values: { starter: false, growth: false, scale: true },
  },
  {
    id: 'sso',
    group: 'Security',
    label: 'SSO and SCIM',
    values: { starter: false, growth: false, scale: true },
  },
];

export default function PricingTableDemo() {
  return (
    <div className="w-full">
      <PricingTable
        plans={PLANS}
        features={FEATURES}
        currency="EUR"
        locale="en-GB"
        currentPlanId="starter"
        onSelectPlan={() => undefined}
      />
    </div>
  );
}

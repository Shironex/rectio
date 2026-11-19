import {
  PricingTable as PlainPricingTable,
  type PricingFeature,
  type PricingPlan,
} from '@rectio/blocks';
import { PricingTable as MotionPricingTable } from '@rectio/blocks/motion';

import { CURRENCY, RATE, type DemoProps } from './demo';

function plans(rate: number): PricingPlan[] {
  return [
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
      monthly: 24 * rate,
      yearly: 240 * rate,
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
      monthly: 49 * rate,
      yearly: 468 * rate,
      unit: 'per seat',
      highlights: [
        'Unlimited seats',
        'Multi-entity consolidation',
        'SSO and SCIM',
        'Priority support',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For regulated companies with their own terms.',
      monthly: null,
      highlights: ['Dedicated environment', 'Custom data retention', 'Named account team'],
      cta: 'Talk to sales',
    },
  ];
}

const FEATURES: PricingFeature[] = [
  {
    id: 'seats',
    group: 'Workspace',
    label: 'Seats',
    values: { starter: '1', growth: 'Up to 25', scale: 'Unlimited', enterprise: 'Unlimited' },
  },
  {
    id: 'runs',
    group: 'Workspace',
    label: 'Workflow runs a month',
    values: { starter: '500', growth: '10,000', scale: '100,000', enterprise: 'Custom' },
  },
  {
    id: 'storage',
    group: 'Workspace',
    label: 'File storage',
    values: { starter: '5 GB', growth: '250 GB', scale: '2 TB', enterprise: 'Custom' },
  },
  {
    id: 'approvals',
    group: 'Finance',
    label: 'Approval flows',
    values: { starter: false, growth: true, scale: true, enterprise: true },
  },
  {
    id: 'entities',
    group: 'Finance',
    label: 'Multi-entity consolidation',
    values: { starter: false, growth: false, scale: true, enterprise: true },
  },
  {
    id: 'api',
    group: 'Finance',
    label: 'API access',
    values: { starter: false, growth: true, scale: true, enterprise: true },
  },
  {
    id: 'sso',
    group: 'Security',
    label: 'SSO and SCIM',
    values: { starter: false, growth: false, scale: true, enterprise: true },
  },
  {
    id: 'audit',
    group: 'Security',
    label: 'Audit log retention',
    values: { starter: '30 days', growth: '1 year', scale: '3 years', enterprise: 'Custom' },
  },
];

export function PricingTableDemo({ motion, empty, locale }: DemoProps) {
  const PricingTable = motion ? MotionPricingTable : PlainPricingTable;
  return (
    <PricingTable
      plans={empty ? [] : plans(RATE[locale])}
      features={FEATURES}
      currency={CURRENCY[locale]}
      locale={locale}
      currentPlanId="starter"
      description="Every plan starts with a 14 day trial of Growth. No card needed."
      onSelectPlan={() => undefined}
    />
  );
}

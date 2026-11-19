import {
  Billing as PlainBilling,
  type BillingInvoice,
  type BillingPlan,
  type BillingUsage,
} from '@rectio/blocks';
import { Billing as MotionBilling } from '@rectio/blocks/motion';

import { CURRENCY, NOW, RATE, type DemoProps } from './demo';

const d = (month: number, day: number, year = 2026) => new Date(year, month - 1, day);

const USAGE: BillingUsage[] = [
  {
    id: 'runs',
    label: 'Workflow runs',
    used: 8_420,
    limit: 10_000,
    unit: 'runs',
    resetsOn: d(4, 1),
  },
  { id: 'storage', label: 'File storage', used: 61, limit: 250, unit: 'GB' },
  { id: 'seats', label: 'Seats', used: 8, limit: 8, unit: 'seats' },
];

function invoices(rate: number): BillingInvoice[] {
  return [
    { id: 'b6', number: 'FH-2026-0312', date: d(3, 1), amount: 192 * rate, status: 'open' },
    { id: 'b5', number: 'FH-2026-0211', date: d(2, 1), amount: 192 * rate, status: 'paid' },
    { id: 'b4', number: 'FH-2026-0108', date: d(1, 1), amount: 176 * rate, status: 'paid' },
    { id: 'b3', number: 'FH-2025-1204', date: d(12, 1, 2025), amount: 176 * rate, status: 'paid' },
    { id: 'b2', number: 'FH-2025-1103', date: d(11, 1, 2025), amount: 176 * rate, status: 'void' },
  ];
}

export function BillingDemo({ motion, empty, locale }: DemoProps) {
  const Billing = motion ? MotionBilling : PlainBilling;
  const rate = RATE[locale];
  const plan: BillingPlan = empty
    ? {
        id: 'growth',
        name: 'Growth',
        price: 24 * rate,
        interval: 'month',
        status: 'trialing',
        renewsOn: d(4, 2),
        seats: 8,
      }
    : {
        id: 'growth',
        name: 'Growth',
        price: 192 * rate,
        interval: 'month',
        status: 'active',
        renewsOn: d(4, 1),
        seats: 8,
      };
  return (
    <Billing
      plan={plan}
      usage={empty ? [] : USAGE}
      paymentMethod={{ brand: 'Visa', last4: '4821', expMonth: 4, expYear: 2026 }}
      invoices={empty ? [] : invoices(rate)}
      currency={CURRENCY[locale]}
      locale={locale}
      today={NOW}
      onChangePlan={() => undefined}
      onCancelPlan={() => undefined}
      onUpdatePaymentMethod={() => undefined}
      onDownloadInvoice={() => undefined}
      onAddSeats={() => undefined}
    />
  );
}

'use client';

import { Billing, type BillingInvoice, type BillingPlan, type BillingUsage } from '@rectio/blocks';

export const TODAY = new Date(2026, 2, 19);

export const PLAN: BillingPlan = {
  id: 'growth',
  name: 'Growth',
  price: 192,
  interval: 'month',
  status: 'active',
  renewsOn: new Date(2026, 3, 1),
  seats: 8,
};

export const USAGE: BillingUsage[] = [
  {
    id: 'runs',
    label: 'Workflow runs',
    used: 8420,
    limit: 10000,
    unit: 'runs',
    resetsOn: new Date(2026, 3, 1),
  },
  { id: 'storage', label: 'File storage', used: 61, limit: 250, unit: 'GB' },
  { id: 'seats', label: 'Seats', used: 8, limit: 8, unit: 'seats' },
];

export const INVOICES: BillingInvoice[] = [
  { id: 'i5', number: 'FH-2026-0312', date: new Date(2026, 2, 1), amount: 192, status: 'open' },
  { id: 'i4', number: 'FH-2026-0211', date: new Date(2026, 1, 1), amount: 192, status: 'paid' },
  { id: 'i3', number: 'FH-2026-0108', date: new Date(2026, 0, 1), amount: 176, status: 'paid' },
  { id: 'i2', number: 'FH-2025-1204', date: new Date(2025, 11, 1), amount: 176, status: 'paid' },
  { id: 'i1', number: 'FH-2025-1103', date: new Date(2025, 10, 1), amount: 176, status: 'void' },
];

export const CARD = { brand: 'Visa', last4: '4821', expMonth: 4, expYear: 2026 };

export default function BillingDemo() {
  return (
    <div className="w-full">
      <Billing
        plan={PLAN}
        usage={USAGE}
        paymentMethod={CARD}
        invoices={INVOICES}
        currency="EUR"
        locale="en-GB"
        today={TODAY}
        onChangePlan={() => undefined}
        onCancelPlan={() => undefined}
        onUpdatePaymentMethod={() => undefined}
        onDownloadInvoice={() => undefined}
      />
    </div>
  );
}

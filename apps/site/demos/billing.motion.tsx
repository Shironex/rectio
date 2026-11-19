'use client';

import { Billing } from '@rectio/blocks/motion';

import { CARD, INVOICES, PLAN, TODAY, USAGE } from './billing';

export default function BillingMotionDemo() {
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

'use client';

import { InvoiceDetail } from '@rectio/blocks/motion';

import { INVOICE, TODAY } from './finance-data';

export default function InvoiceDetailMotionDemo() {
  return (
    <div className="w-full">
      <InvoiceDetail
        invoice={INVOICE}
        currency="EUR"
        locale="en-GB"
        today={TODAY}
        onRecordPayment={() => {
          console.info('record payment');
        }}
      />
    </div>
  );
}

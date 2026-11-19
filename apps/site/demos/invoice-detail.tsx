'use client';

import { InvoiceDetail } from '@rectio/blocks';

import { INVOICE, TODAY } from './finance-data';

export default function InvoiceDetailDemo() {
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

'use client';

import { InvoiceList } from '@rectio/blocks';

import { INVOICES, TODAY } from './finance-data';

export default function InvoiceListDemo() {
  return (
    <div className="w-full">
      <InvoiceList
        invoices={INVOICES}
        currency="EUR"
        locale="en-GB"
        today={TODAY}
        defaultPeriod="all"
        onOpenInvoice={(invoice) => {
          console.info('open', invoice.number);
        }}
      />
    </div>
  );
}

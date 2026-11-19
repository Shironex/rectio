import {
  balanceDue,
  documentTotals,
  invoiceState,
  sumMoney,
  type InvoiceSummary,
  type Receivable,
} from '@rectio/blocks';

import { CURRENCY, TODAY } from './company';
import { INVOICE_RECORDS, type InvoiceRecord } from './invoice-records';

export { INVOICE_RECORDS, invoiceRecord, type InvoiceRecord } from './invoice-records';

/** One row of the invoice list, from the full document. */
export function toSummary(record: InvoiceRecord): InvoiceSummary {
  const { document } = record;
  const totals = documentTotals(document.lines, document.payments ?? [], CURRENCY);
  return {
    id: record.id,
    number: document.number,
    customer: record.customer.name,
    issued: document.issued,
    due: document.due,
    total: totals.total,
    ...(totals.paid > 0 && document.status === 'sent' ? { amountPaid: totals.paid } : {}),
    status: document.status,
  };
}

export const INVOICES: readonly InvoiceSummary[] = INVOICE_RECORDS.map(toSummary);

/** What customers still owe, invoice by invoice, for the aging. */
export const RECEIVABLES: readonly Receivable[] = INVOICES.filter(
  (invoice) => balanceDue(invoice, CURRENCY) > 0,
).map((invoice) => ({
  id: invoice.id,
  customer: invoice.customer,
  invoice: invoice.number,
  due: invoice.due,
  outstanding: balanceDue(invoice, CURRENCY),
}));

/** Overdue invoices, largest balance first. */
export const OVERDUE_INVOICES: readonly InvoiceSummary[] = INVOICES.filter(
  (invoice) => invoiceState(invoice, TODAY) === 'overdue',
).sort((a, b) => balanceDue(b, CURRENCY) - balanceDue(a, CURRENCY));

export const RECEIVABLES_TOTAL = sumMoney(
  RECEIVABLES.map((r) => r.outstanding),
  CURRENCY,
);

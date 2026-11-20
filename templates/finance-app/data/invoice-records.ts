import {
  documentTotals,
  type InvoiceDocument,
  type InvoiceLine,
  type InvoicePayment,
  type InvoiceStatus,
} from '@rectio/blocks';

import { COMPANY, CURRENCY, TODAY, addDays, day } from './company';
import { CUSTOMERS, type Customer } from './customers';

/**
 * Sample invoices: every one a full document (lines, VAT, payments), generated from a fixed seed so
 * the figures are the same on every build. This file holds data only, so a server module (the
 * static params of /invoices/[id]) can read the ids without loading any component code.
 */

export interface InvoiceRecord {
  /** The URL segment: the invoice number in lower case. */
  id: string;
  customer: Customer;
  document: InvoiceDocument;
  /** When the customer opened the emailed invoice, if they did. */
  viewed?: Date;
  /** Payment reminders sent so far. */
  reminders: readonly Date[];
}

/** A small seeded generator (mulberry32), so the sample stays stable between builds. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Product {
  description: string;
  detail?: string;
  unit?: string;
  unitPrice: number;
  quantity: (random: () => number) => number;
}

const between = (low: number, high: number) => (random: () => number) =>
  low + Math.floor(random() * (high - low + 1));

const PRODUCTS: readonly Product[] = [
  {
    description: 'Fleetplan licence',
    detail: 'Annual subscription, per seat',
    unit: 'seats',
    unitPrice: 186,
    quantity: (r) => between(2, 12)(r) * 5,
  },
  {
    description: 'Route optimisation module',
    detail: 'Annual add-on, per seat',
    unit: 'seats',
    unitPrice: 64,
    quantity: (r) => between(2, 8)(r) * 5,
  },
  {
    description: 'Implementation',
    detail: 'Fixed scope, as agreed in the statement of work',
    unitPrice: 4_800,
    quantity: () => 1,
  },
  {
    description: 'Integration with the ERP',
    detail: 'Order and stock sync',
    unitPrice: 1_450,
    quantity: () => 1,
  },
  {
    description: 'On-site training',
    unit: 'h',
    unitPrice: 95,
    quantity: between(7, 21),
  },
  {
    description: 'Consulting',
    detail: 'Process review and route design',
    unit: 'days',
    unitPrice: 880,
    quantity: between(1, 5),
  },
  {
    description: 'Premium support',
    detail: 'Response within four business hours',
    unit: 'months',
    unitPrice: 640,
    quantity: (r) => (r() > 0.5 ? 3 : 1),
  },
];

/** Invoices left unpaid past their due date, so the aging has something in every bucket. */
const OVERDUE = new Set([3, 14, 22, 27, 31, 33]);
/** Part paid, with the rest still open. */
const PART_PAID = new Map([
  [27, 0.4],
  [38, 0.5],
]);
const PAID_EARLY = new Set([36, 40]);
const VOIDED = 19;
/** The last three are drafts, still being written. */
const DRAFT_DATES = [day(2026, 11, 12), day(2026, 11, 16), day(2026, 11, 18)];
const COUNT = 46;
const FIRST_NUMBER = 171;

function vatNote(customer: Customer): string {
  if (customer.vatRate > 0) return '';
  if (customer.taxId.startsWith('NO'))
    return 'Export of services outside the EU: Irish VAT does not apply. ';
  return 'Reverse charge: VAT to be accounted for by the recipient (Article 196, Directive 2006/112/EC). ';
}

function buildLines(random: () => number, customer: Customer, index: number): InvoiceLine[] {
  const count = 1 + Math.floor(random() * 3);
  const picked = new Set<number>();
  while (picked.size < count) picked.add(Math.floor(random() * PRODUCTS.length));
  return [...picked]
    .sort((a, b) => a - b)
    .map((productIndex, lineIndex) => {
      const product = PRODUCTS[productIndex] ?? PRODUCTS[0];
      if (product === undefined) throw new Error('No products');
      return {
        id: `l${String(index)}-${String(lineIndex)}`,
        description: product.description,
        ...(product.detail === undefined ? {} : { detail: product.detail }),
        quantity: product.quantity(random),
        ...(product.unit === undefined ? {} : { unit: product.unit }),
        unitPrice: product.unitPrice,
        taxRate: customer.vatRate,
      };
    });
}

/** Gross total of a set of lines, by the same rule the invoice block prints. */
function grossTotal(lines: readonly InvoiceLine[]): number {
  return documentTotals(lines, [], CURRENCY).total;
}

function buildRecords(): InvoiceRecord[] {
  const random = seeded(20261119);
  const records: InvoiceRecord[] = [];
  for (let index = 0; index < COUNT; index += 1) {
    const customer = CUSTOMERS[Math.floor(random() * CUSTOMERS.length)] ?? CUSTOMERS[0];
    if (customer === undefined) throw new Error('No customers');
    const draftIndex = index - (COUNT - DRAFT_DATES.length);
    const issued = DRAFT_DATES[draftIndex] ?? addDays(day(2026, 6, 2), Math.round(index * 3.75));
    const due = addDays(issued, customer.terms);
    const lines = buildLines(random, customer, index);
    const total = grossTotal(lines);
    const number = `INV-2026-${String(FIRST_NUMBER + index).padStart(4, '0')}`;

    let status: InvoiceStatus = 'sent';
    const payments: InvoicePayment[] = [];
    const pay = (date: Date, amount: number) => {
      payments.push({
        id: `p${String(index)}-${String(payments.length)}`,
        date,
        amount,
        method: customer.vatRate > 0 ? 'Bank transfer' : 'Bank transfer, SEPA',
      });
    };

    const isOverdueByDate = due.getTime() < TODAY.getTime();
    if (draftIndex >= 0) status = 'draft';
    else if (index === VOIDED) status = 'void';
    else if (PART_PAID.has(index)) {
      const share = PART_PAID.get(index) ?? 0.5;
      pay(addDays(issued, 12), Math.round(total * share));
    } else if ((isOverdueByDate && !OVERDUE.has(index)) || PAID_EARLY.has(index)) {
      status = 'paid';
      const offset = Math.floor(random() * 18) - 12;
      const paidOn = addDays(due, offset);
      pay(paidOn.getTime() > TODAY.getTime() ? addDays(TODAY, -1) : paidOn, total);
    }

    const reminders: Date[] = [];
    if (status === 'sent' && isOverdueByDate) {
      reminders.push(addDays(due, 3));
      if (TODAY.getTime() - due.getTime() > 21 * 86_400_000) reminders.push(addDays(due, 17));
    }

    records.push({
      id: number.toLowerCase(),
      customer,
      document: {
        number,
        status,
        issued,
        due,
        reference: `PO ${String(4100 + Math.floor(random() * 800))}`,
        seller: {
          name: COMPANY.legalName,
          address: COMPANY.address,
          taxId: COMPANY.taxId,
        },
        buyer: { name: customer.name, address: customer.address, taxId: customer.taxId },
        lines,
        payments,
        notes: `${vatNote(customer)}Pay by bank transfer to ${COMPANY.iban} (BIC ${COMPANY.bic}), quoting ${number}.`,
      },
      ...(status === 'draft' ? {} : { viewed: addDays(issued, 1 + Math.floor(random() * 3)) }),
      reminders,
    });
  }
  return records;
}

/** Newest first, as the list shows them. */
export const INVOICE_RECORDS: readonly InvoiceRecord[] = buildRecords().reverse();

export function invoiceRecord(id: string): InvoiceRecord | undefined {
  return INVOICE_RECORDS.find((record) => record.id === id);
}

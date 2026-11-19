import { daysBetween, fromMinor, toMinor, type InvoiceStatus } from '../lib/finance';

export interface InvoiceLine {
  id: string;
  description: string;
  /** A second line under the description, such as the service period. */
  detail?: string;
  quantity: number;
  /** Unit name printed after the quantity, such as h or pcs. */
  unit?: string;
  /** Net price of one unit, in major units. */
  unitPrice: number;
  /** VAT rate as a fraction: 0.23 for 23%. Zero for exempt or reverse charge lines. */
  taxRate: number;
}

export interface InvoicePayment {
  id: string;
  date: Date;
  amount: number;
  /** How it arrived, such as "Bank transfer". */
  method: string;
}

export interface InvoiceParty {
  name: string;
  address: readonly string[];
  /** VAT number, NIP or other tax id. */
  taxId?: string;
}

export interface InvoiceDocument {
  number: string;
  status: InvoiceStatus;
  issued: Date;
  due: Date;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  lines: readonly InvoiceLine[];
  payments?: readonly InvoicePayment[];
  /** The buyer's purchase order or your own reference. */
  reference?: string;
  notes?: string;
}

export interface VatGroup {
  rate: number;
  /** Net amount taxed at this rate. */
  net: number;
  vat: number;
}

export interface DocumentTotals {
  /** Each line's net amount, rounded to the minor unit, in line order. */
  lineNets: number[];
  subtotal: number;
  /** One group per VAT rate, highest rate first. */
  vat: VatGroup[];
  vatTotal: number;
  total: number;
  paid: number;
  balance: number;
}

/**
 * Totals the way EU invoices are usually printed: each line's net amount is rounded first, VAT is
 * computed per rate on the sum of those nets (not per line) and rounded once, half away from zero.
 * Every sum runs in minor units.
 */
export function documentTotals(
  lines: readonly InvoiceLine[],
  payments: readonly InvoicePayment[],
  currency: string,
): DocumentTotals {
  const netMinor = lines.map((line) => toMinor(line.quantity * line.unitPrice, currency));
  const byRate = new Map<number, number>();
  lines.forEach((line, index) => {
    byRate.set(line.taxRate, (byRate.get(line.taxRate) ?? 0) + (netMinor[index] ?? 0));
  });
  const groups = [...byRate]
    .sort(([a], [b]) => b - a)
    .map(([rate, net]) => ({ rate, net, vat: Math.sign(net) * Math.round(Math.abs(net * rate)) }));
  const subtotal = netMinor.reduce((sum, value) => sum + value, 0);
  const vatTotal = groups.reduce((sum, group) => sum + group.vat, 0);
  const paid = payments.reduce((sum, payment) => sum + toMinor(payment.amount, currency), 0);
  const total = subtotal + vatTotal;
  const major = (minor: number) => fromMinor(minor, currency);
  return {
    lineNets: netMinor.map(major),
    subtotal: major(subtotal),
    vat: groups.map((group) => ({
      rate: group.rate,
      net: major(group.net),
      vat: major(group.vat),
    })),
    vatTotal: major(vatTotal),
    total: major(total),
    paid: major(paid),
    balance: major(total - paid),
  };
}

export type PaymentState = 'draft' | 'void' | 'paid' | 'partial' | 'overdue' | 'due';

/** Where the invoice stands for the reader: paid in full, part paid, overdue or simply due. */
export function paymentState(
  status: InvoiceStatus,
  totals: Pick<DocumentTotals, 'paid' | 'balance'>,
  due: Date,
  today: Date,
): PaymentState {
  if (status === 'draft' || status === 'void') return status;
  if (status === 'paid' || totals.balance <= 0) return 'paid';
  if (daysBetween(due, today) > 0) return 'overdue';
  return totals.paid > 0 ? 'partial' : 'due';
}

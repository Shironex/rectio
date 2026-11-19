import { daysBetween, sumMoney, type InvoiceStatus } from '../lib/finance';

export type { InvoiceStatus };

export interface InvoiceSummary {
  id: string;
  /** The invoice number as printed, such as INV-2026-0142. */
  number: string;
  customer: string;
  issued: Date;
  due: Date;
  /** Gross total in major units. */
  total: number;
  /** Received so far, for part payments. */
  amountPaid?: number;
  status: InvoiceStatus;
}

/** What the reader needs to act on: the status plus the calendar. */
export type InvoiceState = 'draft' | 'due' | 'overdue' | 'paid' | 'void';

export function invoiceState(invoice: InvoiceSummary, today: Date): InvoiceState {
  if (invoice.status !== 'sent') return invoice.status;
  return daysBetween(invoice.due, today) > 0 ? 'overdue' : 'due';
}

/** What is still owed. Drafts and void invoices owe nothing yet. */
export function balanceDue(invoice: InvoiceSummary, currency: string): number {
  if (invoice.status !== 'sent') return 0;
  return sumMoney([invoice.total, -(invoice.amountPaid ?? 0)], currency);
}

/** "Due today", "Due in 3 days", "4 days overdue": the due date as the reader thinks of it. */
export function dueText(invoice: InvoiceSummary, today: Date): string | null {
  const state = invoiceState(invoice, today);
  if (state !== 'due' && state !== 'overdue') return null;
  const days = daysBetween(today, invoice.due);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 1) return `Due in ${String(days)} days`;
  return days === -1 ? '1 day overdue' : `${String(-days)} days overdue`;
}

export type InvoicePeriod = 'this-month' | 'last-month' | 'quarter' | 'year' | 'all';

/** First and last day (inclusive) of a period around `today`, or null for all time. */
export function periodRange(period: InvoicePeriod, today: Date): { from: Date; to: Date } | null {
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (period) {
    case 'this-month':
      return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0) };
    case 'last-month':
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) };
    case 'quarter': {
      const first = m - (m % 3);
      return { from: new Date(y, first, 1), to: new Date(y, first + 3, 0) };
    }
    case 'year':
      return { from: new Date(y, 0, 1), to: new Date(y, 11, 31) };
    case 'all':
      return null;
  }
}

export function inPeriod(date: Date, period: InvoicePeriod, today: Date): boolean {
  const range = periodRange(period, today);
  if (range === null) return true;
  return daysBetween(range.from, date) >= 0 && daysBetween(date, range.to) >= 0;
}

export type StatusFilter = 'all' | 'outstanding' | 'overdue' | 'paid' | 'draft';

export function matchesFilter(state: InvoiceState, filter: StatusFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'outstanding':
      return state === 'due' || state === 'overdue';
    case 'overdue':
      return state === 'overdue';
    case 'paid':
      return state === 'paid';
    case 'draft':
      return state === 'draft';
  }
}

export interface InvoiceTotals {
  /** Still owed on sent invoices, overdue included. */
  outstanding: number;
  overdue: number;
  overdueCount: number;
  paid: number;
  counts: Record<StatusFilter, number>;
}

export function invoiceTotals(
  invoices: readonly InvoiceSummary[],
  today: Date,
  currency: string,
): InvoiceTotals {
  const counts: Record<StatusFilter, number> = {
    all: invoices.length,
    outstanding: 0,
    overdue: 0,
    paid: 0,
    draft: 0,
  };
  const outstanding: number[] = [];
  const overdue: number[] = [];
  const paid: number[] = [];
  for (const invoice of invoices) {
    const state = invoiceState(invoice, today);
    for (const filter of ['outstanding', 'overdue', 'paid', 'draft'] as const) {
      if (matchesFilter(state, filter)) counts[filter] += 1;
    }
    if (state === 'due' || state === 'overdue') outstanding.push(balanceDue(invoice, currency));
    if (state === 'overdue') overdue.push(balanceDue(invoice, currency));
    if (state === 'paid') paid.push(invoice.total);
  }
  return {
    outstanding: sumMoney(outstanding, currency),
    overdue: sumMoney(overdue, currency),
    overdueCount: counts.overdue,
    paid: sumMoney(paid, currency),
    counts,
  };
}

import { daysBetween, sumMoney } from '../../lib/finance';
import { numberFormat } from '../lib/saas';

export type BillingInterval = 'month' | 'year';
export type BillingPlanStatus = 'active' | 'trialing' | 'past-due' | 'canceled';

export interface BillingPlan {
  id: string;
  name: string;
  /** Price per interval, in major units. */
  price: number;
  interval: BillingInterval;
  status: BillingPlanStatus;
  /** The next charge, or the day access ends for a canceled plan. */
  renewsOn: Date;
  /** Seats included, shown beside the price. */
  seats?: number;
}

export interface BillingUsage {
  id: string;
  label: string;
  used: number;
  /** The allowance on the plan. */
  limit: number;
  /** The unit in plural, such as "runs" or "GB". */
  unit: string;
  resetsOn?: Date;
}

export interface BillingPaymentMethod {
  /** Card network or method name, such as "Visa" or "SEPA debit". */
  brand: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
}

export type BillingInvoiceStatus = 'paid' | 'open' | 'failed' | 'void';

export interface BillingInvoice {
  id: string;
  number: string;
  date: Date;
  /** Gross amount in major units. */
  amount: number;
  status: BillingInvoiceStatus;
}

export type BillingUsageLevel = 'ok' | 'warning' | 'over';

/** Fine below 80 per cent, a warning from 80 up to a full allowance, over only past it. */
export function billingUsageLevel(used: number, limit: number): BillingUsageLevel {
  if (limit <= 0) return used > 0 ? 'over' : 'ok';
  const share = used / limit;
  if (share > 1) return 'over';
  if (share >= 0.8) return 'warning';
  return 'ok';
}

/** What the level means in words, so a full meter is never colour alone. */
export function billingUsageNote(
  usage: BillingUsage,
  locale: string,
  resetText: string | null,
): string {
  const format = numberFormat(locale);
  const reset = resetText === null ? '' : `, resets ${resetText}`;
  if (usage.used > usage.limit) {
    return `Over the allowance by ${format.format(usage.used - usage.limit)} ${usage.unit}${reset}`;
  }
  if (usage.limit > 0 && usage.used === usage.limit) {
    return `All ${format.format(usage.limit)} ${usage.unit} in use${reset}`;
  }
  if (billingUsageLevel(usage.used, usage.limit) === 'warning') {
    return `${format.format(usage.limit - usage.used)} ${usage.unit} left${reset}`;
  }
  return resetText === null ? 'Within the allowance' : `Resets ${resetText}`;
}

export type BillingCardState = 'ok' | 'expiring' | 'expired';

/** A card that expires this month or next is expiring; one past its month has expired. */
export function billingCardState(method: BillingPaymentMethod, today: Date): BillingCardState {
  if (method.expMonth === undefined || method.expYear === undefined) return 'ok';
  const months =
    (method.expYear - today.getFullYear()) * 12 + (method.expMonth - 1 - today.getMonth());
  if (months < 0) return 'expired';
  if (months <= 1) return 'expiring';
  return 'ok';
}

/** Days until the next charge (or the end of access), never below zero. */
export function billingDaysLeft(plan: BillingPlan, today: Date): number {
  return Math.max(0, daysBetween(today, plan.renewsOn));
}

export interface BillingInvoiceTotals {
  paid: number;
  /** Open and failed invoices: what is still owed. */
  owed: number;
  owedCount: number;
}

/** Paid and still owed across invoices, exact to the minor unit. Void invoices count nowhere. */
export function billingInvoiceTotals(
  invoices: readonly BillingInvoice[],
  currency: string,
): BillingInvoiceTotals {
  const owed = invoices.filter((i) => i.status === 'open' || i.status === 'failed');
  return {
    paid: sumMoney(
      invoices.filter((i) => i.status === 'paid').map((i) => i.amount),
      currency,
    ),
    owed: sumMoney(
      owed.map((i) => i.amount),
      currency,
    ),
    owedCount: owed.length,
  };
}

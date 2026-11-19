import { daysBetween, sumMoney } from '../lib/finance';

export type VendorStatus = 'active' | 'on-hold' | 'archived';

/** One unpaid bill from a vendor: what is still owed on it and when it falls due. */
export interface VendorBill {
  id: string;
  due: Date;
  /** Outstanding amount in major units. */
  amount: number;
}

export interface Vendor {
  id: string;
  name: string;
  /** The person you deal with, or an email address. */
  contact?: string;
  /** Payment terms in days: 14 for net 14, 30 for net 30. */
  termsDays: number;
  status: VendorStatus;
  /** Unpaid bills; paid ones are left out. */
  bills: readonly VendorBill[];
  lastPayment?: { date: Date; amount: number };
}

export interface VendorFigures {
  /** Everything still owed. */
  balance: number;
  /** Owed on bills past their due date. */
  overdue: number;
  overdueCount: number;
  /** The earliest due date from today on, if any bill is not yet due. */
  nextDue?: Date;
  /** Days from today to `nextDue`; zero is today. */
  nextDueIn?: number;
  /** Owed on bills due from today to the horizon. */
  dueSoon: number;
}

/** A vendor's money in one pass: balance, overdue, next due date and what falls due soon. */
export function vendorFigures(
  vendor: Vendor,
  today: Date,
  currency: string,
  horizonDays = 7,
): VendorFigures {
  const overdue: number[] = [];
  const soon: number[] = [];
  let nextDue: Date | undefined;
  for (const bill of vendor.bills) {
    const ahead = daysBetween(today, bill.due);
    if (ahead < 0) overdue.push(bill.amount);
    else {
      if (ahead <= horizonDays) soon.push(bill.amount);
      if (nextDue === undefined || bill.due.getTime() < nextDue.getTime()) nextDue = bill.due;
    }
  }
  return {
    balance: sumMoney(
      vendor.bills.map((b) => b.amount),
      currency,
    ),
    overdue: sumMoney(overdue, currency),
    overdueCount: overdue.length,
    ...(nextDue === undefined ? {} : { nextDue, nextDueIn: daysBetween(today, nextDue) }),
    dueSoon: sumMoney(soon, currency),
  };
}

export type VendorFilter = 'all' | VendorStatus;

export const VENDOR_FILTERS: readonly VendorFilter[] = ['all', 'active', 'on-hold', 'archived'];

export function matchesVendorFilter(status: VendorStatus, filter: VendorFilter): boolean {
  return filter === 'all' || status === filter;
}

export interface VendorTotals {
  owed: number;
  overdue: number;
  /** Vendors with anything overdue. */
  overdueVendors: number;
  dueSoon: number;
  /** Vendors with a bill due within the horizon. */
  dueSoonVendors: number;
  counts: Record<VendorFilter, number>;
}

export function vendorTotals(
  vendors: readonly Vendor[],
  today: Date,
  currency: string,
  horizonDays = 7,
): VendorTotals {
  const counts: Record<VendorFilter, number> = {
    all: vendors.length,
    active: 0,
    'on-hold': 0,
    archived: 0,
  };
  const owed: number[] = [];
  const overdue: number[] = [];
  const soon: number[] = [];
  let overdueVendors = 0;
  let dueSoonVendors = 0;
  for (const vendor of vendors) {
    counts[vendor.status] += 1;
    const figures = vendorFigures(vendor, today, currency, horizonDays);
    owed.push(figures.balance);
    overdue.push(figures.overdue);
    soon.push(figures.dueSoon);
    if (figures.overdueCount > 0) overdueVendors += 1;
    if (figures.dueSoon !== 0) dueSoonVendors += 1;
  }
  return {
    owed: sumMoney(owed, currency),
    overdue: sumMoney(overdue, currency),
    overdueVendors,
    dueSoon: sumMoney(soon, currency),
    dueSoonVendors,
    counts,
  };
}

/**
 * Text for search: lower case, accents and the Polish ł folded away, so "lodz" finds "Łódź" and
 * "muller" finds "Müller".
 */
export function foldSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase()
    .trim();
}

/** Vendors whose name or contact holds every word of the query, in any order. */
export function searchVendors<T extends Pick<Vendor, 'name' | 'contact'>>(
  vendors: readonly T[],
  query: string,
): T[] {
  const words = foldSearchText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...vendors];
  return vendors.filter((vendor) => {
    const haystack = foldSearchText(`${vendor.name} ${vendor.contact ?? ''}`);
    return words.every((word) => haystack.includes(word));
  });
}

export type VendorSortKey = 'name' | 'balance' | 'overdue' | 'nextDue' | 'terms';

/**
 * Vendors in the order of a column, for a server that sorts the same way the table does. Names sort
 * by the locale's collation; vendors with nothing due come last when sorting by next due date.
 */
export function sortVendors(
  vendors: readonly Vendor[],
  key: VendorSortKey,
  {
    today,
    currency,
    locale,
    descending = false,
  }: { today: Date; currency: string; locale?: string; descending?: boolean },
): Vendor[] {
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  const figures = new Map(vendors.map((v) => [v.id, vendorFigures(v, today, currency)]));
  const value = (vendor: Vendor): number => {
    const f = figures.get(vendor.id);
    switch (key) {
      case 'balance':
        return f?.balance ?? 0;
      case 'overdue':
        return f?.overdue ?? 0;
      case 'nextDue':
        return f?.nextDue?.getTime() ?? Infinity;
      case 'terms':
        return vendor.termsDays;
      case 'name':
        return 0;
    }
  };
  const sorted = vendors.toSorted((a, b) => {
    if (key === 'name') return collator.compare(a.name, b.name);
    const va = value(a);
    const vb = value(b);
    // Nothing due stays last in either direction.
    if (va === Infinity || vb === Infinity) return va === vb ? 0 : va === Infinity ? 1 : -1;
    return va - vb;
  });
  if (!descending) return sorted;
  if (key !== 'nextDue') return sorted.reverse();
  const dated = sorted.filter((v) => figures.get(v.id)?.nextDue !== undefined).reverse();
  return [...dated, ...sorted.filter((v) => figures.get(v.id)?.nextDue === undefined)];
}

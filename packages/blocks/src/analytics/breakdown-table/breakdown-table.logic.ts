import { relativeChange } from '../../lib/finance';

/** One line of a breakdown: a channel, a plan, a country, a product. */
export interface BreakdownItem {
  id: string;
  label: string;
  value: number;
  /** The same line a period ago, for its change. */
  previous?: number | null | undefined;
}

export type BreakdownSortKey = 'label' | 'value' | 'change';

export interface BreakdownSort {
  key: BreakdownSortKey;
  ascending: boolean;
}

export interface BreakdownRow {
  id: string;
  label: string;
  value: number;
  previous: number | null;
  /** Its share of the total of every item. */
  share: number;
  /** Its change against `previous`; null without one or from zero. */
  change: number | null;
  /** Its bar's length against the longest row shown, 0 to 1. */
  length: number;
  /** The row that gathers the items past the limit. */
  other: boolean;
  /** How many items the other row gathers. */
  count: number;
}

export interface BreakdownModel {
  rows: BreakdownRow[];
  total: number;
  totalPrevious: number | null;
  totalChange: number | null;
  /** How many items the limit hides inside the other row. */
  hidden: number;
}

function compare(sort: BreakdownSort, locale: string) {
  const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
  const direction = sort.ascending ? 1 : -1;
  return (a: BreakdownRow, b: BreakdownRow) => {
    if (sort.key === 'label') return collator.compare(a.label, b.label) * direction;
    const left = sort.key === 'value' ? a.value : a.change;
    const right = sort.key === 'value' ? b.value : b.change;
    // Rows without a change sink to the end whichever way the column runs.
    if (left === null && right === null) return collator.compare(a.label, b.label);
    if (left === null) return 1;
    if (right === null) return -1;
    return (left - right) * direction || collator.compare(a.label, b.label);
  };
}

/**
 * The rows of a breakdown: sorted, each with its share of the total and change, and past `limit`
 * the smallest items gathered into one other row that stays last. The limit always keeps the
 * largest items, whatever the sort; the sort then orders what is shown.
 */
export function breakdownModel(
  items: readonly BreakdownItem[],
  options: { sort: BreakdownSort; limit?: number | undefined; locale: string },
): BreakdownModel {
  const clean = items.map((item) => ({
    ...item,
    value: Number.isFinite(item.value) ? item.value : 0,
    previous:
      item.previous === undefined || item.previous === null || !Number.isFinite(item.previous)
        ? null
        : item.previous,
  }));
  const total = clean.reduce((sum, item) => sum + item.value, 0);
  const withPrevious = clean.filter((item) => item.previous !== null);
  const totalPrevious =
    withPrevious.length === clean.length && clean.length > 0
      ? withPrevious.reduce((sum, item) => sum + (item.previous ?? 0), 0)
      : null;
  const row = (item: (typeof clean)[number]): BreakdownRow => ({
    id: item.id,
    label: item.label,
    value: item.value,
    previous: item.previous,
    share: total === 0 ? 0 : item.value / total,
    change: item.previous === null ? null : relativeChange(item.value, item.previous),
    length: 0,
    other: false,
    count: 1,
  });
  const byValue = [...clean].sort((a, b) => b.value - a.value);
  // A limit below zero or not a number is no limit; an other row of one item is no saving, so
  // that item shows instead.
  const asked =
    options.limit === undefined || !(options.limit >= 0) ? undefined : Math.floor(options.limit);
  const limit = asked === undefined || asked >= clean.length - 1 ? clean.length : asked;
  const kept = byValue.slice(0, limit).map(row);
  const rest = byValue.slice(limit);
  const rows = kept.sort(compare(options.sort, options.locale));
  if (rest.length > 0) {
    const value = rest.reduce((sum, item) => sum + item.value, 0);
    const known = rest.every((item) => item.previous !== null);
    const previous = known ? rest.reduce((sum, item) => sum + (item.previous ?? 0), 0) : null;
    rows.push({
      id: '__other',
      label: '',
      value,
      previous,
      share: total === 0 ? 0 : value / total,
      change: previous === null ? null : relativeChange(value, previous),
      length: 0,
      other: true,
      count: rest.length,
    });
  }
  const longest = Math.max(0, ...rows.map((r) => r.value));
  for (const r of rows) r.length = longest <= 0 ? 0 : Math.max(0, r.value) / longest;
  return {
    rows,
    total,
    totalPrevious,
    totalChange: totalPrevious === null ? null : relativeChange(total, totalPrevious),
    hidden: rest.length,
  };
}

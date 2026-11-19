import type { RecordState } from './state-badge';

/**
 * Every word a block prints comes from its messages object: English by default, yours when you
 * pass `messages`. Plain strings stay strings; anything that counts or names a figure is a small
 * function, so a language can order the words and pick its plural forms itself. Pass only the keys
 * you change; a full set is typed, so a translation that misses a key fails to compile.
 */

/** Words several blocks share: record states and the chart's table toggle. */
export interface CommonMessages {
  /** The badge text of each record state. */
  states: Record<RecordState, string>;
  showTable: string;
  hideTable: string;
}

export const COMMON_MESSAGES: CommonMessages = {
  states: {
    draft: 'Draft',
    due: 'Due',
    overdue: 'Overdue',
    partial: 'Part paid',
    paid: 'Paid',
    void: 'Void',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    scheduled: 'Scheduled',
    'in-transit': 'In transit',
    failed: 'Failed',
    cancelled: 'Cancelled',
    active: 'Active',
    'on-hold': 'On hold',
    archived: 'Archived',
    matched: 'Matched',
    suggested: 'Suggested',
    unmatched: 'Unmatched',
  },
  showTable: 'Show table',
  hideTable: 'Hide table',
};

/** A block's English messages with the keys you passed laid over them. */
export function mergeMessages<T extends object>(defaults: T, overrides: Partial<T> | undefined): T {
  return overrides === undefined ? defaults : { ...defaults, ...overrides };
}

/** Plural forms by CLDR category; `other` is required, the rest fall back to it. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/**
 * The form of a word for a count in a locale: `plural(3, { one: 'faktura', few: 'faktury',
 * many: 'faktur', other: 'faktury' }, 'pl-PL')` is "faktury". For use inside message functions.
 */
export function plural(count: number, forms: PluralForms, locale: string): string {
  const category = new Intl.PluralRules(locale).select(count);
  return forms[category] ?? forms.other;
}

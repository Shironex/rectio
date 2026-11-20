/**
 * The messages helpers for the docs blocks. They behave exactly like the finance and SaaS blocks'
 * own (`lib/messages.ts`): English by default, the keys you pass laid over them, plain strings for
 * words and small functions for anything that counts or names a value. The docs blocks keep their
 * own copy so a docs site installs no money maths or charts with them.
 */

/** A block's English messages with the keys you passed laid over them. */
export function mergeMessages<T extends object>(defaults: T, overrides: Partial<T> | undefined): T {
  return overrides === undefined ? defaults : { ...defaults, ...overrides };
}

/** Plural forms by CLDR category; `other` is required, the rest fall back to it. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/** The form of a word for a count in a locale, for use inside message functions. */
export function plural(count: number, forms: PluralForms, locale: string): string {
  const category = new Intl.PluralRules(locale).select(count);
  return forms[category] ?? forms.other;
}

/** The locale you passed, else the runtime's. */
export function resolveLocale(locale?: string): string {
  return locale ?? new Intl.NumberFormat().resolvedOptions().locale;
}

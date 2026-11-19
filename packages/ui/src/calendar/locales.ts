import type { DayPickerLocale } from '@daypicker/react';
import { de } from '@daypicker/react/locale/de';
import { enGB } from '@daypicker/react/locale/en-GB';
import { enUS } from '@daypicker/react/locale/en-US';
import { pl } from '@daypicker/react/locale/pl';

/**
 * Locales the date components know by BCP 47 tag. Each carries month and day names, the first day
 * of the week (Monday for en-GB, pl-PL and de-DE, Sunday for en-US), the short date pattern and
 * translated screen reader labels. Pass any other DayPicker locale with `dateLocale`.
 */
const KNOWN: Record<string, DayPickerLocale> = {
  'en-GB': enGB,
  'en-IE': enGB,
  'en-US': enUS,
  en: enUS,
  'pl-PL': pl,
  pl,
  'de-DE': de,
  de,
};

/** The DayPicker locale for a tag: exact match first, then the language, then en-US. */
export function resolveDateLocale(locale?: string): DayPickerLocale {
  const tag = locale ?? Intl.DateTimeFormat().resolvedOptions().locale;
  const language = tag.split('-')[0] ?? tag;
  return KNOWN[tag] ?? KNOWN[language] ?? enUS;
}

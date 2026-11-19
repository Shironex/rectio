/**
 * Small helpers the marketing blocks share. Plain functions, no React: a server can run them too.
 */

/**
 * A light check that an address looks like one: something, an @, a domain with a dot. The real
 * check is the confirmation email; this only catches typos before a round trip.
 */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** A calendar date as people read it, such as 4 March 2026, in the reader's locale. */
export function formatDate(date: Date | string, locale?: string): string {
  const value = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    value,
  );
}

/** A machine-readable date for a `<time dateTime>` attribute. */
export function isoDate(date: Date | string): string {
  if (typeof date === 'string') return date.slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** An id for a heading made from its text: "Your rights" becomes "your-rights". */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Minutes to read a text at an average adult pace, never less than one. */
export function readingMinutes(text: string, wordsPerMinute = 230): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / wordsPerMinute));
}

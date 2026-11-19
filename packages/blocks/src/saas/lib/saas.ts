/**
 * Shared logic of the SaaS blocks: text, time and size formatting, and the email and password
 * rules the account forms agree on. Pure functions, so a server can run the same checks.
 */

/** Up to two initials from a person's or a team's name, for an avatar without a picture. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** A loose but honest email check: one @, a dot in the domain, no spaces. */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export interface PasswordCheck {
  id: 'length' | 'case' | 'number' | 'symbol';
  label: string;
  met: boolean;
}

/** The rules a new password is held to, each met or not, in the order they are shown. */
export function passwordChecks(password: string, minLength = 12): PasswordCheck[] {
  return [
    {
      id: 'length',
      label: `At least ${String(minLength)} characters`,
      met: password.length >= minLength,
    },
    {
      id: 'case',
      label: 'Upper and lower case letters',
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { id: 'number', label: 'A number', met: /\d/.test(password) },
    { id: 'symbol', label: 'A symbol, such as ! or #', met: /[^A-Za-z0-9\s]/.test(password) },
  ];
}

export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

/** How strong a password reads: the checks it meets, with length as the gate for the top grades. */
export function passwordStrength(password: string, minLength = 12): PasswordStrength {
  if (password === '') return 'empty';
  const checks = passwordChecks(password, minLength);
  const met = checks.filter((check) => check.met).length;
  const long = checks[0]?.met === true;
  if (!long || met <= 1) return 'weak';
  if (met === 2) return 'fair';
  if (met === 3) return 'good';
  return 'strong';
}

/** True when a form's error record holds at least one message. */
export function hasErrors(errors: object): boolean {
  return Object.values(errors).some((value) => value !== undefined);
}

/** True when every rule is met: the bar a new password must clear. */
export function passwordAccepted(password: string, minLength = 12): boolean {
  return passwordChecks(password, minLength).every((check) => check.met);
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "now", "5 minutes ago", "yesterday", "in 3 days": a moment as the reader thinks of it. */
export function relativeTime(date: Date, now: Date, locale: string): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  // Under a minute either way reads as "now".
  if (Math.abs(seconds) < 45) return format.format(0, 'second');
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(Math.round(seconds / 60), 'minute');
}

/** "19 Mar, 14:05": a timestamp short enough for a row. */
export function formatDateTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Same calendar day, in local time. */
export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "Today", "Yesterday" or the date itself: the heading over a day of events. */
export function dayLabel(date: Date, today: Date, locale: string): string {
  if (sameDay(date, today)) return 'Today';
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (sameDay(date, yesterday)) return 'Yesterday';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date);
}

const BYTE_UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const;

/** "512 bytes", "1.4 MB", "3 GB": decimal units, one decimal place under ten. */
export function formatBytes(bytes: number, locale: string): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1000 && unit < BYTE_UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: BYTE_UNITS[unit],
    unitDisplay: unit === 0 ? 'long' : 'short',
    maximumFractionDigits: unit === 0 || value >= 10 ? 0 : 1,
  }).format(value);
}

/** "1,204" or "1 204": a count in the reader's locale. */
export function formatCount(count: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(count);
}

/** "1 member", "3 members". */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${String(count)} ${count === 1 ? one : many}`;
}

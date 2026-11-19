import { dateFormat, isEmail } from '../lib/saas';

/** The editable part of a profile. */
export interface ProfileValues {
  name: string;
  email: string;
  /** Job title, shown beside the name across the workspace. */
  jobTitle: string;
  /** IANA time zone, such as Europe/Warsaw. */
  timeZone: string;
}

export interface ProfileErrors {
  name?: string;
  email?: string;
}

export function profileErrors(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {};
  if (values.name.trim() === '') errors.name = 'Enter the name your team knows you by.';
  const email = values.email.trim();
  if (email === '') errors.email = 'Enter your email address.';
  else if (!isEmail(email)) errors.email = 'Enter an email address like name@company.com.';
  return errors;
}

const FIELDS: readonly (keyof ProfileValues)[] = ['name', 'email', 'jobTitle', 'timeZone'];

/** The fields that differ from what is saved, ignoring spaces at either end. */
export function profileChanges(
  saved: ProfileValues,
  draft: ProfileValues,
): (keyof ProfileValues)[] {
  return FIELDS.filter((field) => saved[field].trim() !== draft[field].trim());
}

/** A new email needs confirming before it replaces the old one. */
export function profileEmailChanged(saved: ProfileValues, draft: ProfileValues): boolean {
  return saved.email.trim().toLowerCase() !== draft.email.trim().toLowerCase();
}

/** Deleting asks for the account's email typed back, case and spaces aside. */
export function profileDeleteConfirmed(email: string, typed: string): boolean {
  return typed.trim().toLowerCase() === email.trim().toLowerCase() && typed.trim() !== '';
}

/** "Warsaw (GMT+1)": a time zone as a picker shows it, with its current offset. */
export function timeZoneLabel(timeZone: string, at: Date, locale: string): string {
  const city = timeZone.split('/').at(-1)?.replaceAll('_', ' ') ?? timeZone;
  try {
    const offset =
      dateFormat(locale, { timeZone, timeZoneName: 'shortOffset' })
        .formatToParts(at)
        .find((part) => part.type === 'timeZoneName')?.value ?? '';
    return offset === '' ? city : `${city} (${offset})`;
  } catch {
    return city;
  }
}

/** The time it is in a time zone, short and in the locale; empty when the zone is unknown. */
export function profileLocalTime(timeZone: string, at: Date, locale: string): string {
  try {
    return dateFormat(locale, { timeZone, timeStyle: 'short' }).format(at);
  } catch {
    return '';
  }
}

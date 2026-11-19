import { isEmail } from '../lib/marketing';

export interface ContactValues {
  name: string;
  email: string;
  company: string;
  /** The chosen topic's value, or empty when the form has no topics. */
  topic: string;
  message: string;
  /** Whether the sender agreed to be contacted, when the form asks. */
  consent: boolean;
}

export type ContactErrors = Partial<Record<keyof ContactValues, string>>;

export const EMPTY_CONTACT: ContactValues = {
  name: '',
  email: '',
  company: '',
  topic: '',
  message: '',
  consent: false,
};

/** Shortest message worth sending: a few words, not a stray key press. */
export const MIN_MESSAGE_LENGTH = 10;

/**
 * Checks a contact form before it is sent and says what to fix in each field, in words a person can
 * act on. `needsTopic` and `needsConsent` follow the form's own options.
 */
export function validateContact(
  values: ContactValues,
  {
    needsTopic = false,
    needsConsent = false,
  }: { needsTopic?: boolean; needsConsent?: boolean } = {},
): ContactErrors {
  const errors: ContactErrors = {};
  if (values.name.trim() === '') errors.name = 'Enter your name.';
  if (values.email.trim() === '') errors.email = 'Enter your email address.';
  else if (!isEmail(values.email))
    errors.email = 'Enter an email address such as name@company.com.';
  if (needsTopic && values.topic === '') errors.topic = 'Choose what this is about.';
  if (values.message.trim().length < MIN_MESSAGE_LENGTH)
    errors.message = `Tell us a little more: at least ${String(MIN_MESSAGE_LENGTH)} characters.`;
  if (needsConsent && !values.consent) errors.consent = 'Agree to be contacted so we can reply.';
  return errors;
}

import { isEmail, passwordAccepted } from '../lib/saas';

/**
 * The reset flow, one step at a time: ask for the email, confirm the link went out, choose the
 * new password (from the emailed link), then confirm it changed.
 */
export type ResetPasswordStep = 'request' | 'sent' | 'reset' | 'done';

/** What stops a reset link from being requested, or null. */
export function resetRequestError(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed === '') return 'Enter the email address of your account.';
  if (!isEmail(trimmed)) return 'Enter an email address like name@company.com.';
  return null;
}

export interface NewPasswordErrors {
  password?: string;
  confirm?: string;
}

/** The new password must meet every rule and be typed the same twice. */
export function newPasswordErrors(
  password: string,
  confirm: string,
  minLength = 12,
): NewPasswordErrors {
  const errors: NewPasswordErrors = {};
  if (password === '') errors.password = 'Choose a new password.';
  else if (!passwordAccepted(password, minLength)) {
    errors.password = 'Meet every rule below to continue.';
  }
  if (confirm === '') errors.confirm = 'Type the new password again.';
  else if (confirm !== password) errors.confirm = 'The two passwords do not match.';
  return errors;
}

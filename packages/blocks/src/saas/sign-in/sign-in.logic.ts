import { isEmail } from '../lib/saas';

export interface SignInValues {
  email: string;
  password: string;
  /** Keep the session after the browser closes. */
  remember: boolean;
}

export type SignInMethod = 'password' | 'magic-link';

export interface SignInErrors {
  email?: string;
  password?: string;
}

/**
 * What stops a sign in from being sent, per field. A magic link needs only the email. The
 * password is checked for presence only: its rules belong to sign up, and a sign in form that
 * judges a password tells an attacker which rule an account follows.
 */
export function signInErrors(values: SignInValues, method: SignInMethod): SignInErrors {
  const errors: SignInErrors = {};
  const email = values.email.trim();
  if (email === '') errors.email = 'Enter your email address.';
  else if (!isEmail(email)) errors.email = 'Enter an email address like name@company.com.';
  if (method === 'password' && values.password === '') errors.password = 'Enter your password.';
  return errors;
}

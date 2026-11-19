import { isEmail, passwordAccepted } from '../lib/saas';

export interface SignUpValues {
  name: string;
  email: string;
  password: string;
  /** Agreed to your terms and privacy notice. */
  acceptedTerms: boolean;
}

export interface SignUpErrors {
  name?: string;
  email?: string;
  password?: string;
  acceptedTerms?: string;
}

/**
 * What stops an account from being created, per field. The password must meet every rule of
 * `passwordChecks`; the terms must be accepted when `requireTerms` is on.
 */
export function signUpErrors(
  values: SignUpValues,
  options: { minLength?: number; requireTerms?: boolean } = {},
): SignUpErrors {
  const { minLength = 12, requireTerms = true } = options;
  const errors: SignUpErrors = {};
  if (values.name.trim() === '') errors.name = 'Enter your name.';
  const email = values.email.trim();
  if (email === '') errors.email = 'Enter your work email address.';
  else if (!isEmail(email)) errors.email = 'Enter an email address like name@company.com.';
  if (values.password === '') errors.password = 'Choose a password.';
  else if (!passwordAccepted(values.password, minLength)) {
    errors.password = 'Meet every rule below to continue.';
  }
  if (requireTerms && !values.acceptedTerms) {
    errors.acceptedTerms = 'Accept the terms to create your account.';
  }
  return errors;
}

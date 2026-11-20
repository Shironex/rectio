import type { SignInValues, SignUpValues } from '@rectio/blocks';

/**
 * The account screens call these and nothing else: wire your auth provider or API here. Each one
 * resolves `{ ok: true }` once the step is done, or `{ ok: false, message }` to show why not. The
 * samples wait a moment so the pending states show, and accept any well-formed input except the
 * cases noted, so every error state can be tried. `via` names the provider a sign-in went through.
 */
export type AuthResult = { ok: true; via?: string } | { ok: false; message: string };

const wait = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

/** Signs in with email and password. The sample refuses passwords shorter than 8 characters. */
export async function signIn(values: SignInValues): Promise<AuthResult> {
  await wait();
  if (values.password.length < 8)
    return { ok: false, message: 'That email and password do not match an account.' };
  return { ok: true };
}

/** Emails a one-time sign-in link. */
export async function sendMagicLink(email: string): Promise<AuthResult> {
  await wait();
  return email === '' ? { ok: false, message: 'Enter your email.' } : { ok: true };
}

/** Starts a sign-in with a provider: redirect to your OAuth flow here. */
export async function signInWith(provider: 'google' | 'microsoft'): Promise<AuthResult> {
  await wait(300);
  // Send the browser to your provider here, for example `/auth/${provider}`.
  return { ok: true, via: provider };
}

/** Creates the account. The sample says taken for any address at copperline.app. */
export async function signUp(
  values: SignUpValues,
): Promise<AuthResult | { ok: false; taken: true }> {
  await wait();
  if (values.email.endsWith('@copperline.app')) return { ok: false, taken: true };
  return { ok: true };
}

/** Checks a two-factor code. The sample refuses 000000. */
export async function verifyCode(code: string): Promise<AuthResult> {
  await wait();
  return code === '000000'
    ? { ok: false, message: 'That code has expired. Use the newest one in your app.' }
    : { ok: true };
}

/** Checks a backup code. */
export async function verifyBackupCode(code: string): Promise<AuthResult> {
  await wait();
  return code.length < 8 ? { ok: false, message: 'Backup codes are 10 characters.' } : { ok: true };
}

/** Emails a password reset link. */
export async function requestReset(email: string): Promise<AuthResult> {
  await wait();
  return email === '' ? { ok: false, message: 'Enter your email.' } : { ok: true };
}

/** Sets the new password from a reset link. */
export async function resetPassword(password: string): Promise<AuthResult> {
  await wait();
  return password === '' ? { ok: false, message: 'Enter a new password.' } : { ok: true };
}

/** Where the code comes from: an authenticator app, a text message or an email. */
export type TwoFactorMethod = 'app' | 'sms' | 'email';

/** A code is ready to check once every slot holds a digit. */
export function twoFactorCodeComplete(code: string, length = 6): boolean {
  return new RegExp(`^\\d{${String(length)}}$`).test(code);
}

/** Seconds until another code may be sent, never below zero. */
export function twoFactorResendWait(sentAt: Date | undefined, now: Date, cooldown = 30): number {
  if (sentAt === undefined) return 0;
  const elapsed = Math.floor((now.getTime() - sentAt.getTime()) / 1000);
  return Math.max(0, cooldown - elapsed);
}

/** "0:42": a short countdown. */
export function formatTwoFactorWait(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60))}:${String(s % 60).padStart(2, '0')}`;
}

/** A backup code as people type it, cleaned: letters and digits only, upper case. */
export function normalizeBackupCode(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

/** Backup codes are ten letters or digits; spaces and hyphens in what was typed do not count. */
export function backupCodeError(value: string, length = 10): string | null {
  const clean = normalizeBackupCode(value);
  if (clean === '') return 'Enter one of your backup codes.';
  if (clean.length !== length) {
    return `Backup codes have ${String(length)} letters and digits. Check for a missed character.`;
  }
  return null;
}

/**
 * Hides most of a phone number or email so the screen confirms the destination without showing
 * it in full: "+44 ••• 829", "i•••@fernhill.io".
 */
export function maskTwoFactorDestination(destination: string, method: TwoFactorMethod): string {
  if (method === 'email') {
    const [user = '', domain = ''] = destination.split('@');
    return `${user.slice(0, 1)}•••@${domain}`;
  }
  const digits = destination.replace(/\D/g, '');
  const last = digits.slice(-3);
  const country = destination.trim().startsWith('+') ? `+${digits.slice(0, 2)} ` : '';
  return `${country}••• ${last}`;
}

/** The sentence under the heading: where to look for the code. */
export function twoFactorInstruction(
  method: TwoFactorMethod,
  length: number,
  destination?: string,
): string {
  const digits = `${String(length)}-digit code`;
  if (method === 'app') return `Open your authenticator app and enter the ${digits} it shows.`;
  const where =
    destination === undefined ? '' : ` to ${maskTwoFactorDestination(destination, method)}`;
  return method === 'sms'
    ? `We sent a ${digits} by text message${where}.`
    : `We sent a ${digits} by email${where}.`;
}

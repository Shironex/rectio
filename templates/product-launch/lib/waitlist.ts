/**
 * Where the waitlist form sends. A stub that waits a moment and hands back a place in line, so the
 * form can be tried end to end; replace the body with a call to your list or CRM. Throw an Error
 * with a readable message and the form shows it.
 */

export interface WaitlistEntry {
  email: string;
  position: number;
}

const pause = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** A stable place in line from the address, so the sample always answers the same way. */
function placeFor(email: string): number {
  let hash = 0;
  for (const char of email) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return 2400 + hash;
}

/** What the form sends: the address, the role if given, and whether they want a beta session. */
export interface WaitlistSignup {
  email: string;
  role: string;
  beta: boolean;
}

export async function joinWaitlist({ email }: WaitlistSignup): Promise<WaitlistEntry> {
  await pause(900);
  // A sample failure, so the error state can be tried: any address at example.invalid bounces.
  if (email.endsWith('@example.invalid')) throw new Error('That address bounced. Try another.');
  return { email, position: placeFor(email) };
}

/** A stored entry, or null when the value is missing or not one this page wrote. */
export function parseEntry(raw: string | null | undefined): WaitlistEntry | null {
  if (raw == null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const entry = value as Partial<WaitlistEntry>;
    return typeof entry.email === 'string' && typeof entry.position === 'number'
      ? { email: entry.email, position: entry.position }
      : null;
  } catch {
    return null;
  }
}

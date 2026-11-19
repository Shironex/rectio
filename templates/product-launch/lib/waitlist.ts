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

export async function joinWaitlist({
  email,
}: {
  email: string;
  role: string;
}): Promise<WaitlistEntry> {
  await pause(900);
  if (email.endsWith('@example.invalid')) throw new Error('That address bounced. Try another.');
  return { email, position: placeFor(email) };
}

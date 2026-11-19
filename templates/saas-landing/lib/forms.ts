import type { ContactValues } from '@rectio/blocks/marketing';

/**
 * Where the site's forms send. Both are stubs that wait a moment and succeed, so the forms can be
 * tried end to end; replace the bodies with calls to your email provider and your inbox or CRM.
 * Throw an Error with a readable message and the form shows it.
 */

const pause = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export async function subscribe(email: string): Promise<void> {
  await pause(700);
  if (email.endsWith('@example.invalid')) throw new Error('That address bounced. Try another.');
}

export async function sendContact(values: ContactValues): Promise<void> {
  await pause(900);
  if (values.email.endsWith('@example.invalid')) {
    throw new Error('We could not send that. Try again, or write to us directly.');
  }
}

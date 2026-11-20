import { CheckIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

import { PRODUCT } from '@/data/workspace';

/** The product mark on the account screens: its initial on the accent, and the name. */
export function ProductMark() {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="flex size-7 items-center justify-center rounded-control bg-accent text-sm font-strong text-accent-contrast"
      >
        L
      </span>
      <span className="text-base font-strong tracking-tight">{PRODUCT.name}</span>
    </span>
  );
}

const POINTS = [
  'Every email, chat and call in one queue',
  'First-response targets that pause out of hours',
  'Customers with their tickets, people and notes',
];

/** The brand panel beside the form on a wide screen: the promise, three points and a customer. */
export function AuthAside() {
  return (
    <div className="flex h-full flex-col justify-center gap-12">
      <div className="flex flex-col gap-6">
        <p className="font-display text-2xl font-heading tracking-tight text-balance">
          {PRODUCT.tagline}
        </p>
        <ul className="flex flex-col gap-3 text-sm text-fg-muted">
          {POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2.5">
              <CheckIcon
                aria-hidden
                weight="bold"
                className="mt-0.5 size-4 shrink-0 text-accent-strong"
              />
              {point}
            </li>
          ))}
        </ul>
      </div>
      <figure className="flex flex-col gap-3 border-t border-line pt-6">
        <blockquote className="text-sm text-pretty text-fg">
          “We answer 900 tickets a week with nine people, and our customers still get a name, not a
          number.”
        </blockquote>
        <figcaption className="text-sm text-fg-muted">
          Dara Whitfield, Support lead at Northgate Glazing
        </figcaption>
      </figure>
    </div>
  );
}

/** The page around an account form: the canvas, the form centred, a line of small print under it. */
export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10 sm:px-8">
      {children}
      <p className="text-center text-xs text-fg-subtle">
        Protected by two-factor and single sign-on. {PRODUCT.name} never asks for your password by
        email.
      </p>
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';

import { Brand } from '@/components/brand';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center sm:px-8">
      <Link
        href="/"
        className="rounded-control outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus"
      >
        <Brand />
      </Link>
      <h1 className="font-display text-5xl font-regular tracking-tight text-balance text-fg">
        Nothing to quote here
      </h1>
      <p className="max-w-prose text-lg text-fg-muted">
        This page does not exist. The launch page has everything, including the waitlist.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-(--rx-button-height-lg) items-center rounded-control border border-line px-5 font-medium text-fg outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus pointer-fine:hover:bg-surface-hover"
        >
          Back to the launch page
        </Link>
        <Link
          href="/#waitlist"
          className="inline-flex min-h-(--rx-button-height-lg) items-center rounded-control bg-accent px-5 font-medium text-accent-contrast outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus pointer-fine:hover:bg-accent-hover"
        >
          Join the waitlist
        </Link>
      </div>
    </main>
  );
}

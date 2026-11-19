'use client';

import { CompassIcon } from '@phosphor-icons/react';
import { ActionLink, Container, Em } from '@rectio/blocks/marketing/motion';

import { NAV } from '@/data/site';

export function NotFoundPage() {
  return (
    <Container className="flex flex-col items-center gap-10 py-20 sm:py-28">
      <div className="flex max-w-xl flex-col items-center gap-5 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-accent-subtle text-accent-strong">
          <CompassIcon aria-hidden weight="duotone" className="size-7" />
        </span>
        <p className="numeric text-sm font-medium text-fg-muted">Error 404</p>
        <h1 className="font-display text-4xl font-regular tracking-tight text-balance text-fg sm:text-5xl">
          This page is <Em>off the rota</Em>
        </h1>
        <p className="text-lg text-pretty text-fg-muted">
          The link may be old or mistyped. Head home, or pick a page below.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <ActionLink action={{ label: 'Back to home', href: '/' }} />
          <ActionLink action={{ label: 'Contact us', href: '/contact' }} variant="secondary" />
        </div>
      </div>
      <nav aria-label="Popular pages">
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {NAV.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="inline-flex min-h-(--rx-button-height-touch) items-center rounded-control text-base text-fg-muted underline-offset-4 outline-offset-2 pointer-fine:hover:text-fg pointer-fine:hover:underline focus-visible:outline-2 focus-visible:outline-focus"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}

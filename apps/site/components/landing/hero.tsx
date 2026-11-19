import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

import { CopyCommand } from './copy-command';
import { HeroReport } from './hero-report';

export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 pt-14 pb-20 sm:px-8 md:pt-20 lg:grid-cols-12 lg:gap-10 lg:pt-24 lg:pb-28">
      <div className="flex flex-col justify-center gap-8 lg:col-span-5">
        <h1 className="site-enter max-w-xl font-display text-4xl font-heading tracking-tight text-balance text-fg md:text-5xl">
          Interfaces for money, set right.
        </h1>
        <p className="site-enter site-step-1 max-w-md text-lg text-fg-muted">
          React components and tokens for expense tools, ledgers and approvals. Figures align, signs
          stay explicit, themes are token files.
        </p>
        <div className="site-enter site-step-2 flex flex-wrap items-center gap-3">
          <Link
            href="/docs"
            className="site-press inline-flex h-11 items-center gap-2 rounded-control bg-accent px-5 text-base font-medium text-accent-contrast shadow-raised transition-colors duration-fast ease-standard pointer-fine:hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Read the docs
            <ArrowRightIcon aria-hidden weight="bold" className="size-4" />
          </Link>
          <CopyCommand command="pnpm dlx rectio init" />
        </div>
      </div>
      <div className="lg:col-span-7">
        <HeroReport />
      </div>
    </section>
  );
}

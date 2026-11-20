import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

import { CopyCommand } from './copy-command';
import { GithubButton } from './github-button';

/** The page's last word: the install command, the docs and the source, with one line of pitch. */
export function ClosingBand() {
  return (
    <div className="site-panel relative isolate overflow-hidden rounded-panel px-6 py-14 sm:px-10 md:px-14 md:py-20">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="site-reveal site-headline text-fg">
            <span className="font-regular">Free to use,</span> open to change.
          </h2>
          <p className="site-reveal site-step-1 text-lg text-pretty text-fg-muted">
            Every component, block and template is MIT licensed. I build rectio in the open, and
            issues and pull requests are welcome.
          </p>
        </div>
        <div className="site-reveal site-step-2 flex flex-wrap items-center gap-3">
          <CopyCommand command="pnpm dlx @rectio/cli init" />
          <Link
            href="/docs"
            className="site-press inline-flex h-11 items-center gap-2 rounded-control bg-accent px-5 text-base font-medium text-accent-contrast shadow-raised transition-colors duration-fast ease-standard pointer-fine:hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Read the docs
            <ArrowRightIcon aria-hidden weight="bold" className="size-4" />
          </Link>
          <GithubButton />
        </div>
      </div>
    </div>
  );
}

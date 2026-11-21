import { RssIcon } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';

import { ReleaseList } from '@/components/changelog/release-list';
import { Footer } from '@/components/landing/footer';
import { withBase } from '@/lib/base-path';
import { latestRelease, readChangelog } from '@/lib/changelog';

const description =
  'What changed in rectio, newest first: the kit, the templates, the themes, the CLI and the docs.';

export const metadata: Metadata = {
  title: 'Changelog',
  description,
  alternates: {
    types: {
      'application/atom+xml': [{ url: withBase('/changelog.xml'), title: 'rectio changelog' }],
    },
  },
};

/**
 * Every release, read at build time from content/changelog and packages/cli/CHANGELOG.md: a new
 * file there appears here and in the feed with no change to the page.
 */
export default function ChangelogPage() {
  const releases = readChangelog();
  return (
    <>
      <div id="content" className="mx-auto w-full max-w-7xl px-4 pt-12 pb-20 sm:px-8 md:pt-20">
        <header className="flex max-w-2xl flex-col gap-4">
          <h1 className="site-enter font-display text-4xl font-heading tracking-tight text-balance text-fg md:text-5xl">
            Changelog
          </h1>
          <p className="site-enter site-step-1 text-lg text-pretty text-fg-muted">
            What changed in rectio, newest first. Kit items carry their own versions in the
            registry, and the CLI follows semver on npm; this page puts them side by side by date.
          </p>
          <a
            href={withBase('/changelog.xml')}
            className="site-enter site-step-2 inline-flex min-h-11 w-fit items-center gap-2 rounded-control text-base font-medium text-accent-strong underline decoration-accent-strong/40 underline-offset-4 outline-offset-2 pointer-fine:hover:decoration-accent-strong focus-visible:outline-2 focus-visible:outline-focus"
          >
            <RssIcon aria-hidden weight="bold" className="size-4" />
            Follow the Atom feed
          </a>
        </header>

        <div className="mt-12 md:mt-16">
          <ReleaseList releases={releases} latestId={latestRelease(releases)?.id} />
        </div>
      </div>
      <Footer />
    </>
  );
}

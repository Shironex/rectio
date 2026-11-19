import type { Metadata } from 'next';

import { Changelog, DocsLayout } from '@/components/blocks';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { RELEASES } from '@/content/changelog';
import { SITE } from '@/data/site';
import { getNav } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Changelog',
  description: `Every ${SITE.name} release: what was added, improved, fixed and what breaks.`,
};

export default function ChangelogPage() {
  return (
    <DocsLayout
      header={<SiteHeader sections={getNav()} currentHref="/changelog" />}
      footer={<SiteFooter />}
      wide
    >
      <header className="mb-10 flex max-w-2xl flex-col gap-3">
        <h1 className="font-display text-3xl font-heading tracking-tight text-fg sm:text-4xl">
          Changelog
        </h1>
        <p className="text-lg text-pretty text-fg-muted">
          Every release of {SITE.name}, newest first. Breaking changes are marked, and each version
          links to its release notes.
        </p>
      </header>
      <Changelog releases={RELEASES} locale={SITE.locale} />
    </DocsLayout>
  );
}

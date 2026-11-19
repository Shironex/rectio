import Link from 'next/link';

import { DocsLayout } from '@/components/blocks';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getNav } from '@/lib/content';

export default function NotFound() {
  return (
    <DocsLayout header={<SiteHeader sections={getNav()} currentHref="" />} footer={<SiteFooter />}>
      <div className="flex flex-col items-start gap-4 py-16">
        <p className="font-mono text-sm text-fg-subtle">404</p>
        <h1 className="font-display text-3xl font-heading tracking-tight text-fg">
          This page is not in the docs
        </h1>
        <p className="max-w-prose text-pretty text-fg-muted">
          It may have moved in a recent release. Search the docs with the box above, or start again
          from the introduction.
        </p>
        <Link
          href="/docs"
          className="rounded-control text-accent-strong underline underline-offset-4 outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus"
        >
          Go to the introduction
        </Link>
      </div>
    </DocsLayout>
  );
}

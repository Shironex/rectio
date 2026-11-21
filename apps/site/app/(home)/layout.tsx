import type { ReactNode } from 'react';

import { SiteHeader } from '@/components/site-header/site-header';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#content"
        className="sr-only z-50 rounded-control bg-accent px-4 py-2 text-base font-medium text-accent-contrast focus-visible:not-sr-only focus-visible:fixed focus-visible:start-4 focus-visible:top-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="nd-home-layout" className="flex flex-1 flex-col">
        {children}
      </main>
    </>
  );
}

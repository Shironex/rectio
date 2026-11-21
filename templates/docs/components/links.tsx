'use client';

import { DocsLink } from '@rectio/blocks/docs';
import { LinkProvider as KitLinkProvider } from '@rectio/ui';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

/** Sends every link the kit and the docs blocks draw through Next's router, for instant page changes. */
export function LinkProvider({ children }: { children: ReactNode }) {
  return (
    <KitLinkProvider
      // Anchor props may hold explicit undefined handlers, which Next's stricter Link type rejects.
      render={(props) => <Link {...(props as ComponentProps<typeof Link>)} />}
    >
      {children}
    </KitLinkProvider>
  );
}

/** A Markdown link: through the router inside the site, a new tab outside it. */
export function DocsAnchor({ href = '', ...props }: ComponentProps<'a'>) {
  return <DocsLink href={href} {...props} />;
}

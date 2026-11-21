'use client';

import { LinkProvider as KitLinkProvider } from '@rectio/ui';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

/**
 * Sends every link the kit's components and blocks draw through Next's router, so they change
 * pages on the client and follow `basePath` without any prefix in the data.
 */
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

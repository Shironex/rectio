'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// The search index client loads when search first opens, not with every page.
const SearchDialog = dynamic(() => import('./search').then((m) => m.SearchDialog), { ssr: false });

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{ SearchDialog }}
      // rectio reads data-mode; Fumadocs' own pieces read the class. Set both.
      theme={{ attribute: ['class', 'data-mode'], defaultTheme: 'system', enableSystem: true }}
    >
      {children}
    </RootProvider>
  );
}

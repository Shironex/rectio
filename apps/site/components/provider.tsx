'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';

import { SearchDialog } from './search';

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

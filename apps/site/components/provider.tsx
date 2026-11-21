'use client';

import { Dialog } from '@base-ui/react/dialog';
import type { SharedProps } from 'fumadocs-ui/contexts/search';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Suspense, lazy, useState, type ReactNode } from 'react';

// The search dialog and its index client are the heaviest code every page would carry; they load
// when search is first opened.
const LiveSearchDialog = lazy(() => import('./search').then((m) => ({ default: m.SearchDialog })));

/**
 * The docs header's search triggers open a dialog through a shared handle, so a dialog root must be
 * mounted from the start. Until search is first opened that root is this empty one; the first open
 * (a trigger or the hot key) loads the real dialog, which takes over already open.
 */
function SearchDialog(props: SharedProps) {
  const [wanted, setWanted] = useState(false);
  if (props.open && !wanted) setWanted(true);
  const standIn = (
    <Dialog.Root open={props.open} onOpenChange={props.onOpenChange} handle={props.dialogHandle} />
  );
  if (!wanted) return standIn;
  return (
    <Suspense fallback={standIn}>
      <LiveSearchDialog {...props} />
    </Suspense>
  );
}

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

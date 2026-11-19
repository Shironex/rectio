'use client';

import { useSyncExternalStore } from 'react';

/**
 * What a data page shows: its data, or one of the states a real app passes through. Read from
 * `?state=empty|loading|error` (and `invalid` on forms) so each state can be opened and reviewed on
 * its own. In your app, derive this from your data fetching instead.
 */
export type PageState = 'ready' | 'empty' | 'loading' | 'error' | 'invalid';

const STATES: readonly PageState[] = ['empty', 'loading', 'error', 'invalid'];

function subscribe(onChange: () => void) {
  addEventListener('popstate', onChange);
  return () => {
    removeEventListener('popstate', onChange);
  };
}

const read = (): PageState => {
  const state = new URLSearchParams(location.search).get('state');
  return STATES.find((s) => s === state) ?? 'ready';
};

/**
 * The state from the address. The static build renders the ready page; the client switches after
 * hydration, so no Suspense boundary is needed around it.
 */
export function usePageState(): PageState {
  return useSyncExternalStore(subscribe, read, () => 'ready');
}

/** One query parameter, read the same way. */
export function useQueryParam(name: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(location.search).get(name),
    () => null,
  );
}

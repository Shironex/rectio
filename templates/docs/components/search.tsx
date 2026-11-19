'use client';

import {
  DocsSearch,
  createLocalSearch,
  type DocsSearchDocument,
  type DocsSearchProvider,
} from '@rectio/blocks/docs';
import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';

const SUGGESTIONS = [
  { id: 'installation', title: 'Installation', href: '/docs/installation', group: 'Get started' },
  { id: 'retries', title: 'Retries and backoff', href: '/docs/retries', group: 'Guides' },
  { id: 'api', title: 'JavaScript API', href: '/docs/api', group: 'Reference' },
];

/**
 * Search over the index the build writes to /search-index.json. The index loads on the first
 * keystroke, not with the page, and is kept for the rest of the visit.
 */
export function SiteSearch() {
  const router = useRouter();
  const provider = useRef<Promise<DocsSearchProvider> | null>(null);
  const search = useCallback<DocsSearchProvider>(async (query, signal) => {
    provider.current ??= fetch('/search-index.json', { signal: AbortSignal.timeout(10_000) })
      .then((response) => {
        if (!response.ok) throw new Error(`search index: ${String(response.status)}`);
        return response.json() as Promise<DocsSearchDocument[]>;
      })
      .then((documents) => createLocalSearch(documents))
      .catch((error: unknown) => {
        // Lets the next keystroke try again instead of keeping the failure.
        provider.current = null;
        throw error;
      });
    const run = await provider.current;
    return run(query, signal);
  }, []);
  return (
    <DocsSearch
      search={search}
      suggestions={SUGGESTIONS}
      onNavigate={(href) => {
        router.push(href);
      }}
    />
  );
}

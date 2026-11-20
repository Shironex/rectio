'use client';

import { useStaticSearch } from 'fumadocs-core/search/client';
import {
  SearchDialog as Dialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';

import { withBase } from '@/lib/base-path';

/**
 * Search over the prebuilt index at /api/search: no server, the site is static. The index URL is
 * given in full, since the client only knows a Vite base path, never Next's.
 */
export function SearchDialog(props: SharedProps) {
  const search = useStaticSearch({ from: withBase('/api/search') });
  return (
    <Dialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
      </SearchDialogContent>
    </Dialog>
  );
}

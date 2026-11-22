'use client';

import { useState } from 'react';

import { useBlockParts } from '../../lib/block-parts';

/**
 * Long lists in pages: the first `pageSize` rows, then a button that adds the next page. A change of
 * `view` (another filter) starts again from the first page. Totals are never paged.
 */
export function useMore(pageSize: number, view: string) {
  const [state, setState] = useState({ view, limit: pageSize });
  const limit = state.view === view ? state.limit : pageSize;
  return {
    limit,
    more: () => {
      setState({ view, limit: limit + pageSize });
    },
  };
}

export function MoreButton({
  left,
  pageSize,
  label,
  onMore,
}: {
  /** Rows not shown yet. */
  left: number;
  pageSize: number;
  label: (count: number, left: number) => string;
  onMore: () => void;
}) {
  const { Button } = useBlockParts();
  if (left <= 0) return null;
  return (
    <div className="flex justify-center">
      <Button size="sm" variant="secondary" onClick={onMore}>
        {label(Math.min(pageSize, left), left)}
      </Button>
    </div>
  );
}

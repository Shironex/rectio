'use client';

import { useEffect, useRef, useState } from 'react';

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
  allShown,
  onMore,
}: {
  /** Rows not shown yet. */
  left: number;
  pageSize: number;
  label: (count: number, left: number) => string;
  /** Said, and focused, once the last page is drawn and the button is gone. */
  allShown: string;
  onMore: () => void;
}) {
  const { Button } = useBlockParts();
  const [pressed, setPressed] = useState(false);
  const done = useRef<HTMLParagraphElement>(null);
  // The button leaves with the last page: the focus moves to the line that replaces it, never
  // to the top of the document.
  useEffect(() => {
    if (pressed && left <= 0) done.current?.focus();
  }, [pressed, left]);
  if (left <= 0) {
    return pressed ? (
      <p ref={done} tabIndex={-1} className="text-center text-sm text-fg-muted outline-none">
        {allShown}
      </p>
    ) : null;
  }
  return (
    <div className="flex justify-center">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setPressed(true);
          onMore();
        }}
      >
        {label(Math.min(pageSize, left), left)}
      </Button>
    </div>
  );
}

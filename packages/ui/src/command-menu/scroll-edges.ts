'use client';

import { useCallback, useState } from 'react';

export interface ScrollEdges {
  /** Rows are hidden above. */
  start: boolean;
  /** Rows are hidden below. */
  end: boolean;
}

/** A pixel of slack, so a fractional scroll position at the very end does not count as more. */
const SLACK = 1;

/** Which ends of a scrolling list hide rows. */
export function measureScrollEdges(node: HTMLElement): ScrollEdges {
  const { scrollTop, scrollHeight, clientHeight } = node;
  return {
    start: scrollTop > SLACK,
    end: scrollTop + clientHeight < scrollHeight - SLACK,
  };
}

/**
 * Tracks which ends of a scrolling element hide content: on scroll, when the element resizes, and
 * when its rows change, such as a query filtering them. Returns a callback ref and the edges.
 */
export function useScrollEdges() {
  const [edges, setEdges] = useState<ScrollEdges>({ start: false, end: false });

  const ref = useCallback((node: HTMLElement | null) => {
    if (node === null) return;
    const update = () => {
      const next = measureScrollEdges(node);
      setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    };
    update();
    node.addEventListener('scroll', update, { passive: true });
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    resize?.observe(node);
    const rows = typeof MutationObserver === 'undefined' ? null : new MutationObserver(update);
    rows?.observe(node, { childList: true, subtree: true });
    return () => {
      node.removeEventListener('scroll', update);
      resize?.disconnect();
      rows?.disconnect();
    };
  }, []);

  return [ref, edges] as const;
}

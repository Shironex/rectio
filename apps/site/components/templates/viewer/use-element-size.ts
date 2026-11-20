'use client';

import { useEffect, useState, type RefObject } from 'react';

/** The content box of an element, kept current as it resizes; zero until it is measured. */
export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry === undefined) return;
      const { width, height } = entry.contentRect;
      setSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [ref]);
  return size;
}

'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * A strip of short facts moving sideways on a CSS loop, the track drawn twice so it never ends.
 * It pauses under the pointer, while the tab is hidden and off screen; with reduced motion it
 * stands still. The second copy is hidden from assistive technology.
 */
export function Ticker({ items, label }: { items: readonly ReactNode[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    let hidden = document.hidden;
    let away = false;
    const sync = () => {
      element.toggleAttribute('data-paused', hidden || away);
    };
    const onVisibility = () => {
      hidden = document.hidden;
      sync();
    };
    const observer = new IntersectionObserver(([entry]) => {
      away = entry?.isIntersecting !== true;
      sync();
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const list = (copy: number) => (
    <ul
      aria-hidden={copy === 1 ? true : undefined}
      className="flex shrink-0 items-center gap-10 pe-10"
    >
      {items.map((item, i) => (
        <li key={i} className="flex shrink-0 items-center gap-10 whitespace-nowrap">
          {item}
          <span aria-hidden className="size-1 rounded-full bg-line-strong" />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      className="site-ticker overflow-hidden font-mono text-sm text-fg-muted"
    >
      <div className="site-ticker-track flex w-max">
        {list(0)}
        {list(1)}
      </div>
    </div>
  );
}

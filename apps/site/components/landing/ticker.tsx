'use client';

import { PauseIcon, PlayIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * A strip of short facts moving sideways on a CSS loop, the track drawn twice so it never ends.
 * It pauses under the pointer, while the tab is hidden and off screen, and for good from its pause
 * button; with reduced motion it stands still. The second copy is hidden from assistive technology.
 */
export function Ticker({ items, label }: { items: readonly ReactNode[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [stopped, setStopped] = useState(false);

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
      className="flex shrink-0 items-center gap-10 ps-10 pe-10"
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
    <div className="flex items-center gap-2">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        data-stopped={stopped ? '' : undefined}
        className="site-ticker min-w-0 flex-1 overflow-hidden font-mono text-sm text-fg"
      >
        <div className="site-ticker-track flex w-max">
          {list(0)}
          {list(1)}
        </div>
      </div>
      <button
        type="button"
        aria-pressed={stopped}
        aria-label="Pause the facts strip"
        onClick={() => {
          setStopped((value) => !value);
        }}
        className="site-ticker-toggle flex size-8 shrink-0 pointer-coarse:size-11 items-center justify-center rounded-control text-fg-muted transition-colors duration-fast ease-standard pointer-fine:hover:bg-surface-hover pointer-fine:hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {stopped ? (
          <PlayIcon aria-hidden weight="fill" className="size-3.5" />
        ) : (
          <PauseIcon aria-hidden weight="fill" className="size-3.5" />
        )}
      </button>
    </div>
  );
}

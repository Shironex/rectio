import { AnchorSimpleIcon } from '@phosphor-icons/react/ssr';

import { SITE } from '@/data/site';

/** The mark and the name in the header. Swap in your logo here. */
export function Brand() {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="inline-flex size-7 items-center justify-center rounded-control bg-accent text-accent-contrast"
      >
        <AnchorSimpleIcon weight="bold" className="size-4" />
      </span>
      <span className="font-display text-base font-strong tracking-tight text-fg">{SITE.name}</span>
      <span className="rounded-badge border border-line px-1.5 text-xs font-medium text-fg-muted">
        Docs
      </span>
    </span>
  );
}

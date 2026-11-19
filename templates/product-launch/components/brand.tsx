import { SITE } from '@/data/site';

/** Quarry's mark: a cut stone, one simple shape in `currentColor`. Swap in your own logo. */
export function QuarryMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M4 8.5 12 3l8 5.5v7L12 21l-8-5.5z" fill="currentColor" />
      <path
        d="M4 8.5 12 14l8-5.5M12 14v7"
        fill="none"
        stroke="var(--rx-accent-contrast)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Brand() {
  return (
    <span className="inline-flex items-center gap-2 text-fg">
      <QuarryMark className="size-7 text-accent" />
      <span className="font-display text-xl font-strong tracking-tight">{SITE.name}</span>
    </span>
  );
}

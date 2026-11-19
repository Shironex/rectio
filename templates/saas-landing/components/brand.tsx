import type { ReactNode } from 'react';

import { SITE } from '@/data/site';

/**
 * Rostra's mark and its customers' marks. Each is one simple shape in `currentColor`, so it follows
 * the theme; swap in your own logo files.
 */
export function RostraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" />
      <g fill="var(--rx-accent-contrast)">
        <rect x="6" y="6.5" width="12" height="2.6" rx="1.3" />
        <rect x="6" y="10.7" width="8" height="2.6" rx="1.3" />
        <rect x="10" y="14.9" width="8" height="2.6" rx="1.3" />
      </g>
    </svg>
  );
}

export function Brand() {
  return (
    <span className="inline-flex items-center gap-2 text-fg">
      <RostraMark className="size-7 text-accent" />
      <span className="font-display text-xl font-strong tracking-tight">{SITE.name}</span>
    </span>
  );
}

function Wordmark({ mark, name }: { mark: ReactNode; name: string }) {
  return (
    <svg viewBox={`0 0 ${String(30 + name.length * 11)} 28`} className="h-7 w-auto" aria-hidden>
      {mark}
      <text
        x="34"
        y="20"
        fill="currentColor"
        fontSize="18"
        fontWeight="600"
        letterSpacing="-0.4"
        fontFamily="var(--rx-font-family-display)"
      >
        {name}
      </text>
    </svg>
  );
}

const circle = <circle cx="13" cy="14" r="10" fill="currentColor" />;
const ring = <circle cx="13" cy="14" r="8.5" fill="none" stroke="currentColor" strokeWidth="3" />;
const square = <rect x="3" y="4" width="20" height="20" rx="3" fill="currentColor" />;
const diamond = (
  <rect x="6" y="7" width="14" height="14" transform="rotate(45 13 14)" fill="currentColor" />
);
const half = <path d="M3 14a10 10 0 0 1 20 0z" fill="currentColor" />;
const triangle = <path d="M13 3l11 20H2z" fill="currentColor" />;
const waves = (
  <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M3 10c3-3 7 3 10 0s7 3 10 0" />
    <path d="M3 18c3-3 7 3 10 0s7 3 10 0" />
  </g>
);
const plus = (
  <g fill="currentColor">
    <rect x="10" y="3" width="6" height="22" rx="1.5" />
    <rect x="2" y="11" width="22" height="6" rx="1.5" />
  </g>
);

export interface Customer {
  name: string;
  logo: ReactNode;
}

export const CUSTOMERS: readonly Customer[] = [
  { name: 'Harbour Street', logo: <Wordmark mark={waves} name="Harbour Street" /> },
  { name: 'Linden Clinics', logo: <Wordmark mark={plus} name="Linden Clinics" /> },
  { name: 'Northgate', logo: <Wordmark mark={half} name="Northgate" /> },
  { name: 'Copperleaf', logo: <Wordmark mark={diamond} name="Copperleaf" /> },
  { name: 'Brightfield', logo: <Wordmark mark={circle} name="Brightfield" /> },
  { name: 'Alder & Finch', logo: <Wordmark mark={ring} name="Alder & Finch" /> },
  { name: 'Saltmarsh', logo: <Wordmark mark={triangle} name="Saltmarsh" /> },
  { name: 'Quayside', logo: <Wordmark mark={square} name="Quayside" /> },
];

import type { ReactNode } from 'react';

/**
 * The template's invented brand and its customers' marks. Each mark is one simple geometric shape
 * in `currentColor`, so it follows the theme; a real site swaps in its own logos.
 */
export function NorthlakeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" />
      <path
        d="M7 16.5V7.5l10 9V7.5"
        stroke="var(--rx-surface)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Brand() {
  return (
    <span className="inline-flex items-center gap-2 text-fg">
      <NorthlakeMark className="size-7 text-accent" />
      <span className="font-display text-xl font-strong tracking-tight">Northlake</span>
    </span>
  );
}

function Wordmark({ mark, name }: { mark: ReactNode; name: string }) {
  return (
    <svg viewBox={`0 0 ${String(28 + name.length * 11)} 28`} className="h-7 w-auto" aria-hidden>
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
const bars = (
  <g fill="currentColor">
    <rect x="3" y="12" width="5" height="12" rx="1" />
    <rect x="10.5" y="7" width="5" height="17" rx="1" />
    <rect x="18" y="3" width="5" height="21" rx="1" />
  </g>
);
const triangle = <path d="M13 3l11 20H2z" fill="currentColor" />;
const split = (
  <g fill="currentColor">
    <rect x="3" y="4" width="9" height="20" rx="2" />
    <rect x="14" y="4" width="9" height="9" rx="2" />
    <rect x="14" y="15" width="9" height="9" rx="2" />
  </g>
);

export const CUSTOMER_LOGOS = [
  { name: 'Nordwind', logo: <Wordmark mark={half} name="Nordwind" /> },
  { name: 'Halden', logo: <Wordmark mark={ring} name="Halden" /> },
  { name: 'Brightwater', logo: <Wordmark mark={circle} name="Brightwater" /> },
  { name: 'Kestrel', logo: <Wordmark mark={triangle} name="Kestrel" /> },
  { name: 'Orchard', logo: <Wordmark mark={split} name="Orchard" /> },
  { name: 'Vantor', logo: <Wordmark mark={diamond} name="Vantor" /> },
  { name: 'Meridian', logo: <Wordmark mark={bars} name="Meridian" /> },
  { name: 'Solace', logo: <Wordmark mark={square} name="Solace" /> },
];

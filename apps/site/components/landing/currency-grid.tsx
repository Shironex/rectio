'use client';

import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useId, useMemo, useState } from 'react';

/** How many chips show before "See more", at the widest layout. */
const FOLDED = 36;

function symbolOf(code: string) {
  try {
    const part = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find((p) => p.type === 'currency');
    return part?.value ?? code;
  } catch {
    return code;
  }
}

/**
 * Every currency the runtime's Intl knows, as chips with their narrow symbol: Money formats any of
 * them. A search narrows the list; folded, the grid fades out under a "See more" button.
 */
export function CurrencyGrid({ codes, names }: { codes: string[]; names: Record<string, string> }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputId = useId();
  const listId = useId();
  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === '') return codes;
    return codes.filter(
      (code) => code.toLowerCase().includes(q) || (names[code] ?? '').toLowerCase().includes(q),
    );
  }, [codes, names, query]);
  const folded = !open && query === '' && found.length > FOLDED;
  const shown = folded ? found.slice(0, FOLDED) : found;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={inputId} className="relative w-full sm:w-80">
          <span className="sr-only">Search currencies</span>
          <MagnifyingGlassIcon
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
          />
          <input
            id={inputId}
            type="search"
            value={query}
            placeholder="Search by code or name"
            aria-controls={listId}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            className="h-11 w-full rounded-control border border-line-strong bg-surface ps-9 pe-3 text-base text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </label>
        <p aria-live="polite" className="text-sm text-fg-muted tabular-nums">
          {found.length} of {codes.length} currencies
        </p>
      </div>
      <div className="relative">
        <ul
          id={listId}
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {shown.map((code) => (
            <li
              key={code}
              title={names[code]}
              className="flex h-11 items-center justify-between gap-2 rounded-control border border-line bg-surface px-3"
            >
              <span className="font-mono text-sm font-strong text-fg">{code}</span>
              <span className="truncate text-sm text-fg-muted">
                {symbolOf(code) === code ? names[code] : symbolOf(code)}
              </span>
            </li>
          ))}
          {found.length === 0 && (
            <li className="col-span-full py-6 text-base text-fg-muted">
              No currency matches “{query}”.
            </li>
          )}
        </ul>
        {folded && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-accent-subtle"
          />
        )}
      </div>
      {query === '' && found.length > FOLDED && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => {
            setOpen((value) => !value);
          }}
          className={cn(
            'site-press self-center rounded-control border border-line-strong bg-surface px-5 py-2.5 text-base font-medium text-fg',
            'transition-colors duration-fast ease-standard pointer-fine:hover:bg-surface-hover',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
          )}
        >
          {open ? 'Show fewer' : `See all ${String(codes.length)}`}
        </button>
      )}
    </div>
  );
}

'use client';

import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { Money, cn } from '@rectio/ui';
import { useId, useMemo, useState, type ReactNode } from 'react';

/** Rows shown before "See all": divisible by one, two and three columns, so it ends on a full row. */
const FOLDED = 24;
const SAMPLE = 1234.5;

const CONTROL =
  'h-11 w-full rounded-control border border-line-strong bg-surface text-base text-fg placeholder:text-fg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

/** Reads a typed figure leniently: grouping commas and spaces drop out, a bad entry falls back. */
function parseFigure(text: string) {
  const value = Number.parseFloat(text.replaceAll(/[\s,]/g, ''));
  return Number.isFinite(value) ? value : SAMPLE;
}

/**
 * Every currency the runtime's Intl knows, each row set by the Money component: code, full name,
 * and the visitor's figure in that currency's own format, so the right column is one kind of thing
 * all the way down. A search narrows the list; folded, it ends on a whole row under "See all".
 */
export function CurrencyGrid({
  codes,
  names,
  intro,
}: {
  codes: string[];
  names: Record<string, string>;
  /** The section's heading and lede, set in the left column above the controls. */
  intro: ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [figure, setFigure] = useState('1,234.50');
  const [open, setOpen] = useState(false);
  const searchId = useId();
  const figureId = useId();
  const listId = useId();
  const amount = parseFigure(figure);
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
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="flex flex-col gap-8 lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
        {intro}
        <div className="flex flex-col gap-4">
          <label htmlFor={searchId} className="relative">
            <span className="sr-only">Search currencies</span>
            <MagnifyingGlassIcon
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
            />
            <input
              id={searchId}
              type="search"
              value={query}
              placeholder="Search by code or name"
              aria-controls={listId}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              className={cn(CONTROL, 'ps-9 pe-3')}
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={figureId} className="text-sm font-medium text-fg">
              Figure to format
            </label>
            <input
              id={figureId}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={figure}
              aria-controls={listId}
              onChange={(event) => {
                setFigure(event.target.value);
              }}
              className={cn(CONTROL, 'px-3 font-mono tabular-nums')}
            />
          </div>
          <p aria-live="polite" className="text-sm text-fg-muted tabular-nums">
            {found.length} of {codes.length} currencies
          </p>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
        <ul id={listId} className="grid gap-x-10 sm:grid-cols-2">
          {shown.map((code) => (
            <li key={code} className="flex items-baseline gap-3 py-2">
              <span className="w-12 shrink-0 font-mono text-sm font-strong text-fg">{code}</span>
              <span className="min-w-0 flex-1 text-sm text-pretty text-fg-muted">
                {names[code]}
              </span>
              <Money
                amount={amount}
                currency={code}
                locale="en"
                className="shrink-0 text-sm text-fg"
              />
            </li>
          ))}
          {found.length === 0 && (
            <li className="col-span-full py-6 text-base text-fg-muted">
              No currency matches “{query}”. Try a code such as CHF, or a country.
            </li>
          )}
        </ul>
        {query === '' && found.length > FOLDED && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => {
              setOpen((value) => !value);
            }}
            className={cn(
              'site-press self-start rounded-control border border-line-strong bg-surface px-5 py-2.5 text-base font-medium text-fg',
              'transition-colors duration-fast ease-standard pointer-fine:hover:bg-surface-hover',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
            )}
          >
            {open ? 'Show fewer' : `See all ${String(codes.length)}`}
          </button>
        )}
      </div>
    </div>
  );
}

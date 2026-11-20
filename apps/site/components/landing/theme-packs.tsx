import { Badge, Money, cn } from '@rectio/ui';
import type { ReactNode } from 'react';

const SHIPPED = [
  {
    theme: 'default',
    mode: 'light',
    name: 'Default',
    text: 'Warm stone neutrals, a cobalt accent, a plain sans and 4px controls.',
  },
  {
    theme: 'ledger',
    mode: 'dark',
    name: 'Ledger',
    text: 'Green-black ink, a citron accent, serif headings and 2px corners.',
  },
] as const;

const COMING = [
  {
    name: 'Charts pack',
    text: 'A categorical palette that stays apart for colour-blind readers, with matching axis, grid and tooltip tokens.',
  },
  {
    name: 'Statement pack',
    text: 'Serif figures and ruled lines for invoices, statements and anything that gets printed.',
  },
] as const;

/**
 * The theme packs: the two that ship, each shown live in its own theme scope and laid over each
 * other like two swatches, and the two in the works, listed in words only until they exist.
 */
export function ThemePacks({ intro }: { intro: ReactNode }) {
  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
      <div className="flex flex-col gap-8 lg:col-span-5">
        {intro}
        <ul className="flex flex-col gap-5">
          {COMING.map((pack, i) => (
            <li
              key={pack.name}
              className={`site-reveal ${i === 0 ? 'site-step-1' : 'site-step-2'} flex flex-col gap-1.5`}
            >
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-strong text-fg">{pack.name}</h3>
                <Badge tone="info">Planned</Badge>
              </div>
              <p className="max-w-prose text-base text-fg-muted">{pack.text}</p>
            </li>
          ))}
        </ul>
      </div>
      {/* The second swatch overlaps the first's bottom padding, offset in, so both read as a pair. */}
      <div className="flex flex-col lg:col-span-7">
        {SHIPPED.map((pack, i) => (
          <article
            key={pack.theme}
            aria-labelledby={`pack-${pack.theme}`}
            className={cn(
              'site-reveal relative w-11/12 overflow-hidden rounded-panel border border-line-strong shadow-overlay sm:w-4/5',
              i === 0 ? 'sm:-rotate-1' : 'site-step-1 -mt-6 self-end sm:rotate-1',
            )}
          >
            {/* The theme attributes alone scope the tokens: no popups here, so no ThemeScope needed. */}
            <div
              data-theme={pack.theme}
              data-mode={pack.mode}
              className="flex h-full flex-col gap-5 bg-surface-canvas p-6 pb-10 font-sans text-fg sm:p-8 sm:pb-12"
            >
              <div className="flex items-center justify-between gap-3">
                <h3
                  id={`pack-${pack.theme}`}
                  className="font-display text-2xl font-heading text-fg"
                >
                  {pack.name}
                </h3>
                <Badge tone="positive">Shipped</Badge>
              </div>
              <Money
                amount={-61}
                currency="EUR"
                locale="en-IE"
                tone="auto"
                className="font-display text-4xl font-heading"
              />
              <p className="max-w-sm text-base text-fg-muted">{pack.text}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

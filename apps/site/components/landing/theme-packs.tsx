import { Badge, Money } from '@rectio/ui';
import type { ReactNode } from 'react';

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

/** The start of a theme of your own, shown as text: the same token names, your values. */
const OWN_THEME = `{
  "radius": {
    "control": { "$value": "…" }
  },
  "font": {
    "family": {
      "sans": { "$value": "…" }
    }
  }
}`;

/**
 * The theme packs: the one that ships, shown live in its own theme scope, laid over a theme of your
 * own like two swatches, and the packs in the works, listed in words only until they exist.
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
        <article
          aria-labelledby="pack-default"
          className="site-reveal relative w-11/12 overflow-hidden rounded-panel border border-line-strong shadow-overlay sm:w-4/5 sm:-rotate-1"
        >
          {/* The theme attribute alone scopes the tokens: no popups here, so no ThemeScope needed. */}
          <div
            data-theme="default"
            className="flex h-full flex-col gap-5 bg-surface-canvas p-6 pb-10 font-sans text-fg sm:p-8 sm:pb-12"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id="pack-default" className="font-display text-2xl font-heading text-fg">
                Default
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
            <p className="max-w-sm text-base text-fg-muted">
              Warm stone neutrals, a cobalt accent, a plain sans and 4px controls, in light and
              dark.
            </p>
          </div>
        </article>
        <article
          aria-labelledby="pack-yours"
          className="site-reveal site-step-1 relative -mt-6 w-11/12 self-end overflow-hidden rounded-panel border border-dashed border-line-strong bg-surface shadow-overlay sm:w-4/5 sm:rotate-1"
        >
          <div className="flex h-full flex-col gap-5 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h3 id="pack-yours" className="font-display text-2xl font-heading text-fg">
                Yours
              </h3>
              <Badge tone="neutral">One token file</Badge>
            </div>
            <pre className="overflow-x-auto rounded-control bg-surface-sunken p-4 font-mono text-sm text-fg">
              {OWN_THEME}
            </pre>
            <p className="max-w-sm text-base text-fg-muted">
              Set the values your brand needs; every component picks them up, no fork required.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}

import { Badge, Money } from '@rectio/ui';

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
 * The theme packs: the two that ship, each shown live in its own theme scope, and the two in the
 * works, described in words only until they exist.
 */
export function ThemePacks() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
      {SHIPPED.map((pack, i) => (
        <article
          key={pack.theme}
          aria-labelledby={`pack-${pack.theme}`}
          className={`site-reveal ${i === 1 ? 'site-step-1' : ''} overflow-hidden rounded-panel border border-line lg:col-span-4`}
        >
          {/* The theme attributes alone scope the tokens: no popups here, so no ThemeScope needed. */}
          <div
            data-theme={pack.theme}
            data-mode={pack.mode}
            className="flex h-full flex-col gap-5 bg-surface-canvas p-6 font-sans text-fg"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id={`pack-${pack.theme}`} className="font-display text-2xl font-heading text-fg">
                {pack.name}
              </h3>
              <Badge tone="positive">Free, shipped</Badge>
            </div>
            <Money
              amount={-61}
              currency="EUR"
              locale="en-IE"
              tone="auto"
              className="font-display text-4xl font-heading"
            />
            <p className="text-base text-fg-muted">{pack.text}</p>
          </div>
        </article>
      ))}
      <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-4">
        {COMING.map((pack, i) => (
          <article
            key={pack.name}
            aria-labelledby={`pack-${String(i)}`}
            className={`site-reveal ${i === 0 ? 'site-step-2' : 'site-step-3'} flex flex-1 flex-col gap-2 rounded-panel border border-dashed border-line-strong p-6`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id={`pack-${String(i)}`} className="text-lg font-strong text-fg">
                {pack.name}
              </h3>
              <Badge tone="info">Coming</Badge>
            </div>
            <p className="text-base text-fg-muted">{pack.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

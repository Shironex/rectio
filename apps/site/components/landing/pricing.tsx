import { CheckIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

const TIERS = [
  {
    name: 'Solo',
    price: 149,
    who: 'One developer',
    terms: '12 months of updates',
    features: ['Motion add-on', 'Theme packs as they ship', 'Pro finance blocks as they ship'],
  },
  {
    name: 'Lifetime',
    price: 249,
    who: 'One developer',
    terms: 'Updates for as long as rectio ships them',
    features: ['Everything in Solo', 'Every future Pro release', 'One payment, no renewal'],
    recommended: true,
  },
  {
    name: 'Team',
    price: 499,
    who: 'Five developers',
    terms: 'One license for the team',
    features: ['Everything in Solo', 'Five developer seats', 'One invoice'],
  },
] as const;

const ACTION =
  'site-press inline-flex h-11 w-full items-center justify-center rounded-control px-5 text-base font-medium transition-colors duration-fast ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

/** The free tier as a strip, then the three Pro tiers. Prices are one-time, in US dollars. */
export function Pricing() {
  return (
    <div className="flex flex-col gap-4">
      <div className="site-reveal flex flex-col justify-between gap-4 rounded-panel border border-line bg-surface-sunken px-6 py-5 sm:flex-row sm:items-center">
        <p className="text-base text-fg">
          <span className="font-strong">Free.</span>{' '}
          <span className="text-fg-muted">
            Every component, both themes, the CLI, the registry and the MCP server.
          </span>
        </p>
        <Link
          href="/docs/installation"
          className="inline-flex min-h-11 shrink-0 items-center text-base font-medium text-accent-strong underline decoration-line-strong underline-offset-4 pointer-fine:hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Install the free tier
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((tier, i) => {
          const recommended = 'recommended' in tier;
          return (
            <article
              key={tier.name}
              aria-labelledby={`tier-${tier.name}`}
              className={`site-reveal ${i === 0 ? '' : i === 1 ? 'site-step-1' : 'site-step-2'} flex flex-col gap-6 rounded-panel border bg-surface p-6 sm:p-7 ${recommended ? 'border-accent shadow-overlay max-md:order-first' : 'border-line'}`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 id={`tier-${tier.name}`} className="text-lg font-strong text-fg">
                    {tier.name}
                  </h3>
                  {recommended && (
                    <span className="text-sm font-medium text-accent-strong">Recommended</span>
                  )}
                </div>
                <p className="text-sm text-fg-muted">{tier.who}</p>
              </div>
              <p className="flex items-baseline gap-2">
                <span className="numeric font-display text-5xl font-heading tracking-tight text-fg">
                  ${tier.price}
                </span>
                <span className="text-sm text-fg-muted">once</span>
              </p>
              <p className="text-base text-fg">{tier.terms}</p>
              <ul className="flex flex-col gap-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-base text-fg-muted">
                    <CheckIcon
                      aria-hidden
                      weight="bold"
                      className="mt-1 size-3.5 shrink-0 text-positive-strong"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/docs/installation"
                className={`${ACTION} mt-auto ${recommended ? 'bg-accent text-accent-contrast shadow-raised pointer-fine:hover:bg-accent-hover' : 'border border-line bg-surface-raised text-fg shadow-raised pointer-fine:hover:bg-surface-hover'}`}
              >
                Get {tier.name}
              </Link>
            </article>
          );
        })}
      </div>
      <p className="site-reveal text-sm text-fg-muted">
        One-time prices in US dollars, per developer. Checkout opens at launch; until then the
        buttons lead to the free install.
      </p>
    </div>
  );
}

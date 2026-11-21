import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import { formatMoney } from '@rectio/ui';
import Link from 'next/link';

import { CopyCommand } from './copy-command';
import { GithubButton } from './github-button';
import { Glow } from './glow';
import { HeroWindow } from './hero-window';
import { Ticker } from './ticker';
import { WordCycle } from './word-cycle';

/** The nouns the headline cycles through once; it settles on the last. */
const NOUNS = ['invoices,', 'payouts,', 'approvals,', 'money,'] as const;

/**
 * The strip under the headline shows what Money prints, set by the kit's own formatter when the
 * page is built: the kit in numbers is the stat row further down, so the strip never repeats it.
 */
const SAMPLES: {
  amount: number;
  currency: string;
  locale: string;
  note: string;
  accounting?: true;
}[] = [
  { amount: -412.8, currency: 'EUR', locale: 'en-IE', note: 'a true minus, never a hyphen' },
  { amount: 176_400, currency: 'JPY', locale: 'ja-JP', note: 'yen, no minor unit' },
  { amount: 12.5, currency: 'BHD', locale: 'en', note: 'dinar, three decimals' },
  { amount: 1_234_567, currency: 'INR', locale: 'en-IN', note: 'grouped in lakhs' },
  { amount: 1234.5, currency: 'CHF', locale: 'de-CH', note: 'Swiss grouping' },
  {
    amount: -1104.3,
    currency: 'EUR',
    locale: 'en-IE',
    note: 'accounting brackets, on request',
    accounting: true,
  },
  { amount: 0, currency: 'EUR', locale: 'en-IE', note: 'the difference, reconciled' },
];

const samples = SAMPLES.map(({ amount, currency, locale, note, accounting }) => (
  <span key={note} className="flex items-baseline gap-3">
    <span className="text-fg tabular-nums">
      {formatMoney(amount, currency, { locale, accounting: accounting === true })}
    </span>
    <span className="text-fg-muted">{note}</span>
  </span>
));

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pb-14 md:pb-16">
      <div aria-hidden className="site-dots site-dots-hero absolute inset-0 -z-10" />
      <Glow className="-top-80 -right-40 -z-10" />

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 pt-12 sm:px-8 md:pt-20 lg:grid-cols-12 lg:items-end lg:gap-10">
        <h1
          aria-label="Interfaces for money, set right."
          className="site-enter site-display text-fg lg:col-span-8"
        >
          <span className="font-regular">Interfaces for</span>
          <br />
          <span className="font-strong text-accent-strong">
            <WordCycle words={NOUNS} />
          </span>
          <br />
          set right.
        </h1>
        <div className="flex flex-col gap-6 lg:col-span-4 lg:pb-3">
          <p className="site-enter site-step-1 max-w-md text-lg text-pretty text-fg-muted">
            Open source React components, blocks and templates for finance and back-office apps, MIT
            licensed. I build it so figures align and signs stay explicit.
          </p>
          <div className="site-enter site-step-2 flex flex-wrap items-center gap-3">
            <Link
              href="/docs"
              className="site-press inline-flex h-11 items-center gap-2 rounded-control bg-accent px-5 text-base font-medium text-accent-contrast shadow-raised transition-colors duration-fast ease-standard pointer-fine:hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Read the docs
              <ArrowRightIcon aria-hidden weight="bold" className="size-4" />
            </Link>
            <GithubButton />
            <CopyCommand command="pnpm dlx @rectio/cli init" />
          </div>
        </div>
      </div>

      <div className="site-enter site-step-3 mx-auto mt-10 w-full max-w-7xl border-y border-line py-3 md:mt-14">
        <Ticker label="Amounts as Money prints them" items={samples} />
      </div>

      <div className="site-enter site-step-4 mt-10 md:mt-14">
        <HeroWindow />
      </div>
    </section>
  );
}

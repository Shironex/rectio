'use client';

import { Money } from '@rectio/ui';

import { ThemeSwitch } from '@/components/theme-switch';
import { useSiteTheme } from '@/lib/use-site-theme';

import { READOUT, type Readout } from './readout';

/**
 * The theme showpiece. One attribute switches the whole page; the readout shows the token values
 * of the theme and mode on screen, as authored in @rectio/tokens.
 */
export function ThemeShowcase({ values }: { values: Readout }) {
  const { theme, mode } = useSiteTheme();
  const shown = values[theme]?.[mode];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="flex flex-col gap-8 lg:col-span-5">
        <div className="flex flex-col gap-4">
          <h2 className="site-reveal font-display text-3xl font-heading tracking-tight text-balance text-fg md:text-4xl">
            One attribute changes the character.
          </h2>
          <p className="site-reveal site-step-1 max-w-md text-lg text-pretty text-fg-muted">
            A theme is a token file. Switch this page between the two that ship: type, corners,
            colour and the pace of motion all follow, and no component changes.
          </p>
        </div>
        <div className="site-reveal site-step-2 flex flex-col items-start gap-3">
          <ThemeSwitch size="md" />
          <code className="font-mono text-sm text-fg-muted">
            {'<html data-theme="'}
            <span className="text-fg">{theme}</span>
            {'">'}
          </code>
        </div>
      </div>

      <div className="site-reveal site-step-1 flex flex-col overflow-hidden rounded-panel border border-line bg-surface lg:col-span-7">
        <div className="flex flex-col gap-3 border-b border-line px-6 pt-7 pb-6 sm:px-8">
          <p className="text-sm text-fg-muted">Quarter close, Q1 2026</p>
          <p className="font-display text-4xl font-heading tracking-tight text-fg md:text-5xl">
            Net position
          </p>
          <Money
            amount={182406.35}
            currency="EUR"
            locale="en-IE"
            className="text-3xl font-strong text-fg md:text-4xl"
          />
        </div>
        <dl className="grid grid-cols-1 gap-x-8 px-6 py-5 sm:grid-cols-2 sm:px-8">
          {READOUT.map((item) => (
            <div
              key={item.token}
              className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0 sm:nth-last-2:border-b-0"
            >
              <dt className="flex flex-col">
                <span className="text-sm text-fg">{item.label}</span>
                <span className="font-mono text-xs text-fg-subtle">{item.token}</span>
              </dt>
              <dd className="flex min-w-0 items-center gap-2 text-end font-mono text-sm text-fg">
                {'swatch' in item && (
                  <span
                    aria-hidden
                    className={`size-4 shrink-0 rounded-badge border border-line-strong ${item.swatch}`}
                  />
                )}
                <span className="truncate">{shown?.[item.token] ?? ''}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

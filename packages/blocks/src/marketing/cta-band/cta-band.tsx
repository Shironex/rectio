import { cn } from '@rectio/ui';
import { useId, type ReactNode } from 'react';

import { ActionLink, type MarketingAction } from '../lib/action';
import { useMarketingParts } from '../lib/parts';
import { Container } from '../lib/section';

export interface CtaBandProps {
  title: ReactNode;
  description?: ReactNode;
  primary: MarketingAction;
  secondary?: MarketingAction;
  /**
   * `accent` fills the band with the accent colour, the loudest moment on the page; `tinted` keeps
   * it soft for a page that already has one loud section.
   */
  tone?: 'accent' | 'tinted';
  /** `centered` stacks everything; `split` puts the actions beside the copy on wide screens. */
  layout?: 'centered' | 'split';
  /** Something beside or under the copy, such as a small piece of live UI. */
  visual?: ReactNode;
  className?: string;
}

/** The closing ask: one line, one sentence, one primary action. */
export function CtaBand({
  title,
  description,
  primary,
  secondary,
  tone = 'accent',
  layout = 'centered',
  visual,
  className,
}: CtaBandProps) {
  const { Reveal } = useMarketingParts();
  const headingId = useId();
  const accent = tone === 'accent';
  return (
    <section
      aria-labelledby={headingId}
      data-slot="cta-band"
      className={cn('py-12 text-fg sm:py-16', className)}
    >
      <Container width="wide">
        <Reveal
          className={cn(
            '@container relative overflow-hidden rounded-panel px-6 py-14 sm:px-12 sm:py-20',
            accent
              ? 'bg-accent text-accent-contrast'
              : 'border border-line bg-linear-to-br from-accent-subtle to-surface-sunken text-fg',
          )}
        >
          <div
            className={cn(
              'relative flex flex-col gap-8',
              layout === 'centered'
                ? 'mx-auto max-w-2xl items-center text-center'
                : '@4xl:flex-row @4xl:items-end @4xl:justify-between',
            )}
          >
            <div
              className={cn(
                'flex max-w-2xl flex-col gap-4',
                layout === 'centered' && 'items-center',
              )}
            >
              <h2
                id={headingId}
                className="font-display text-3xl font-regular tracking-tight text-balance sm:text-4xl"
              >
                {title}
              </h2>
              {description !== undefined && (
                <p
                  className={cn(
                    'max-w-xl text-lg text-pretty',
                    accent ? 'text-accent-contrast opacity-85' : 'text-fg-muted',
                  )}
                >
                  {description}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <ActionLink
                action={primary}
                arrow
                variant={accent ? 'secondary' : 'primary'}
                className={cn(accent && 'border-transparent')}
              />
              {secondary !== undefined && (
                <ActionLink
                  action={secondary}
                  variant={accent ? 'ghost' : 'secondary'}
                  className={cn(
                    accent &&
                      'border border-accent-contrast text-accent-contrast pointer-fine:hover:bg-accent-hover active:bg-accent-active',
                  )}
                />
              )}
            </div>
          </div>
          {visual !== undefined && <div className="relative mt-12">{visual}</div>}
        </Reveal>
      </Container>
    </section>
  );
}

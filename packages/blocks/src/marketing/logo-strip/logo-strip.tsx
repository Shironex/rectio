import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { Marquee } from '../lib/marquee';
import { useMarketingParts } from '../lib/parts';
import { Container } from '../lib/section';

export interface Logo {
  /** The company's name: the accessible name of its logo. */
  name: string;
  /**
   * The logo, as an SVG or image in `currentColor` so it follows the theme. Without one the name
   * is set as a wordmark.
   */
  logo?: ReactNode;
}

export interface LogoStripProps {
  logos: readonly Logo[];
  /** One quiet line above the logos, such as "Trusted by finance teams at". */
  title?: ReactNode;
  /** `static` lays the logos out in a row that wraps; `marquee` scrolls them sideways. */
  variant?: 'static' | 'marquee';
  className?: string;
}

function LogoItem({ logo }: { logo: Logo }) {
  return logo.logo === undefined ? (
    <span className="font-display text-xl font-strong tracking-tight whitespace-nowrap text-fg-muted">
      {logo.name}
    </span>
  ) : (
    <span
      role="img"
      aria-label={logo.name}
      className="inline-flex h-8 items-center text-fg-muted [&_svg]:h-full [&_svg]:w-auto"
    >
      {logo.logo}
    </span>
  );
}

/**
 * The companies that use the product, logos only: no captions, no categories. Sits directly under
 * the hero. Logos take the muted text colour, so every brand reads at the same weight in both modes.
 */
export function LogoStrip({ logos, title, variant = 'static', className }: LogoStripProps) {
  const { Reveal } = useMarketingParts();
  return (
    <section
      aria-label={typeof title === 'string' ? title : 'Customers'}
      data-slot="logo-strip"
      className={cn('py-12 text-fg sm:py-16', className)}
    >
      <Container width="wide" className="flex flex-col gap-8">
        {title !== undefined && <p className="text-center text-base text-fg-muted">{title}</p>}
        {variant === 'marquee' ? (
          <Reveal>
            <Marquee label="Customer logos">
              {logos.map((logo) => (
                <LogoItem key={logo.name} logo={logo} />
              ))}
            </Marquee>
          </Reveal>
        ) : (
          <Reveal
            as="ul"
            stagger
            className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 sm:gap-x-16"
          >
            {logos.map((logo) => (
              <li key={logo.name}>
                <LogoItem logo={logo} />
              </li>
            ))}
          </Reveal>
        )}
      </Container>
    </section>
  );
}

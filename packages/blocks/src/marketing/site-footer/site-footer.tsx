import { cn } from '@rectio/ui';
import { useId, type ReactNode } from 'react';

import { Anchor, linkFocus, type MarketingLink } from '../lib/action';
import { Container } from '../lib/section';

export interface FooterColumn {
  id: string;
  title: string;
  links: readonly MarketingLink[];
}

export interface SocialLink extends MarketingLink {
  /** An icon from your set; the label stays as its accessible name. */
  icon: ReactNode;
}

export interface SiteFooterProps {
  brand: ReactNode;
  brandLabel: string;
  brandHref?: string;
  /** One line under the brand on what the product is. */
  tagline?: ReactNode;
  /** Link columns, for the `columns` layout. */
  columns?: readonly FooterColumn[];
  /** Privacy, terms, cookies: the small print links along the bottom. */
  legal?: readonly MarketingLink[];
  social?: readonly SocialLink[];
  /** The copyright line, such as "© 2026 Northlake Ltd". */
  copyright: ReactNode;
  /** A slot for a compact newsletter signup or a status badge. */
  extra?: ReactNode;
  /** `columns` for a full site map; `minimal` for one row of brand, links and small print. */
  layout?: 'columns' | 'minimal';
  className?: string;
}

const LINK = cn(
  'inline-flex min-h-8 items-center text-base text-fg-muted transition-colors duration-fast ease-standard pointer-fine:hover:text-fg pointer-coarse:min-h-(--rx-button-height-touch)',
  linkFocus,
);

function Links({ links, className }: { links: readonly MarketingLink[]; className?: string }) {
  return (
    <ul className={className}>
      {links.map((link) => (
        <li key={link.href}>
          <Anchor href={link.href} external={link.external} className={LINK}>
            {link.label}
          </Anchor>
        </li>
      ))}
    </ul>
  );
}

function Social({ social }: { social: readonly SocialLink[] }) {
  return (
    <ul className="flex items-center gap-1">
      {social.map((link) => (
        <li key={link.href}>
          <Anchor
            href={link.href}
            external={link.external ?? true}
            aria-label={link.label}
            className={cn(
              'inline-flex size-9 items-center justify-center text-fg-muted pointer-fine:hover:bg-surface-hover pointer-fine:hover:text-fg pointer-coarse:size-(--rx-button-height-touch) [&_svg]:size-5',
              linkFocus,
            )}
          >
            {link.icon}
          </Anchor>
        </li>
      ))}
    </ul>
  );
}

/**
 * The bottom of every page: brand and tagline, link columns, social links and the small print.
 * `minimal` folds it all into one or two rows for a single-page site.
 */
export function SiteFooter({
  brand,
  brandLabel,
  brandHref = '/',
  tagline,
  columns = [],
  legal = [],
  social = [],
  copyright,
  extra,
  layout = 'columns',
  className,
}: SiteFooterProps) {
  const labelId = useId();
  const home = (
    <Anchor
      href={brandHref}
      aria-label={brandLabel}
      className={cn('inline-flex w-fit items-center', linkFocus)}
    >
      {brand}
    </Anchor>
  );
  if (layout === 'minimal') {
    return (
      <footer
        data-slot="site-footer"
        className={cn('border-t border-line py-10 text-fg', className)}
      >
        <Container
          width="wide"
          className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
            {home}
            <p className="text-sm text-fg-muted">{copyright}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legal.length > 0 && (
              <nav aria-label="Legal">
                <Links links={legal} className="flex flex-wrap gap-x-5" />
              </nav>
            )}
            {social.length > 0 && <Social social={social} />}
          </div>
        </Container>
      </footer>
    );
  }
  return (
    <footer
      data-slot="site-footer"
      aria-labelledby={labelId}
      className={cn('border-t border-line bg-surface-sunken pt-16 pb-10 text-fg', className)}
    >
      <h2 id={labelId} className="sr-only">
        Site footer
      </h2>
      <Container width="wide" className="flex flex-col gap-14">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-4">
            {home}
            {tagline !== undefined && (
              <p className="max-w-xs text-base text-pretty text-fg-muted">{tagline}</p>
            )}
            {social.length > 0 && <Social social={social} />}
          </div>
          <nav
            aria-label="Footer"
            className={cn(
              'grid grid-cols-2 gap-8 sm:grid-cols-3',
              extra === undefined ? 'lg:col-span-8 lg:grid-cols-4' : 'lg:col-span-5',
            )}
          >
            {columns.map((column) => (
              <div key={column.id} className="flex flex-col gap-3">
                <h3 className="text-sm font-strong text-fg">{column.title}</h3>
                <Links links={column.links} className="flex flex-col" />
              </div>
            ))}
          </nav>
          {extra !== undefined && <div className="lg:col-span-3">{extra}</div>}
        </div>
        <div className="flex flex-col gap-4 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-fg-muted">{copyright}</p>
          {legal.length > 0 && (
            <nav aria-label="Legal">
              <Links links={legal} className="flex flex-wrap gap-x-6" />
            </nav>
          )}
        </div>
      </Container>
    </footer>
  );
}

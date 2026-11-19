import { ArrowRightIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { DocsBadge, badgeFrom } from '../lib/badge';
import { CopyButton } from '../lib/copy-button';
import type { DocsBadgeData } from '../lib/docs';
import { DocsLink, linkFocus } from '../lib/link';
import { useDocsParts } from '../lib/parts';

export interface DocsAction {
  label: string;
  href: string;
  external?: boolean | undefined;
}

const ACTION = cn(
  'inline-flex h-(--rx-button-height-lg) items-center justify-center gap-2 rounded-(--rx-button-radius) px-4 text-base font-medium whitespace-nowrap',
  'transition-[background-color,border-color,scale] duration-fast ease-standard active:scale-98 motion-reduce:active:scale-100',
  'pointer-coarse:h-(--rx-button-height-touch)',
  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
);

/** A link drawn as a button, for the main ways into the docs. */
export function DocsActionLink({
  action,
  variant = 'primary',
  className,
}: {
  action: DocsAction;
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  return (
    <DocsLink
      href={action.href}
      external={action.external}
      className={cn(
        ACTION,
        variant === 'primary'
          ? 'bg-accent text-accent-contrast pointer-fine:hover:bg-accent-hover'
          : 'border border-line bg-surface text-fg pointer-fine:hover:border-line-strong pointer-fine:hover:bg-surface-hover',
        className,
      )}
    >
      {action.label}
      {variant === 'primary' && (
        <ArrowRightIcon aria-hidden weight="bold" className="size-4 rtl:-scale-x-100" />
      )}
    </DocsLink>
  );
}

export interface DocsHeroProps {
  title: ReactNode;
  description?: ReactNode;
  /** A small line above the title, such as the product name or the current version. */
  eyebrow?: ReactNode;
  primary?: DocsAction;
  secondary?: DocsAction;
  /** A one-line command to copy, such as `npm install @halyard/core`. */
  install?: string | undefined;
  /** The right column: a code sample, install tabs or a screenshot. */
  aside?: ReactNode;
  className?: string;
}

/**
 * The top of a docs home page: what the product is, the two ways in, and something to copy or
 * read straight away beside it. Splits into two columns on wide screens and stacks on phones.
 */
export function DocsHero({
  title,
  description,
  eyebrow,
  primary,
  secondary,
  install,
  aside,
  className,
}: DocsHeroProps) {
  const { Reveal } = useDocsParts();
  return (
    <section
      data-slot="docs-hero"
      aria-label="Introduction"
      className={cn('@container border-b border-line pt-10 pb-12 sm:pt-14 sm:pb-16', className)}
    >
      <div
        className={cn(
          'grid items-center gap-10',
          aside !== undefined && '@4xl:grid-cols-2 @4xl:gap-14',
        )}
      >
        <Reveal stagger className="flex min-w-0 flex-col items-start gap-5">
          {eyebrow !== undefined && (
            <p className="text-sm font-medium text-accent-strong">{eyebrow}</p>
          )}
          <h1 className="max-w-2xl font-display text-4xl font-heading tracking-tight text-balance text-fg sm:text-5xl">
            {title}
          </h1>
          {description !== undefined && (
            <p className="max-w-xl text-lg text-pretty text-fg-muted">{description}</p>
          )}
          {(primary !== undefined || secondary !== undefined) && (
            <div className="flex flex-wrap gap-3 pt-1">
              {primary !== undefined && <DocsActionLink action={primary} />}
              {secondary !== undefined && <DocsActionLink action={secondary} variant="secondary" />}
            </div>
          )}
          {install !== undefined && (
            <div className="flex max-w-full items-center gap-2 rounded-panel border border-line bg-code-background ps-3.5 pe-1 font-mono text-sm text-code-foreground">
              <span aria-hidden className="text-code-token-comment select-none">
                $
              </span>
              <code className="min-w-0 truncate py-2 font-mono">{install}</code>
              <CopyButton value={install} label="Copy install command" />
            </div>
          )}
        </Reveal>
        {aside !== undefined && <Reveal className="min-w-0">{aside}</Reveal>}
      </div>
    </section>
  );
}

export interface LinkCard {
  title: string;
  description?: ReactNode;
  href: string;
  /** A 20px icon. */
  icon?: ReactNode;
  badge?: string | DocsBadgeData | undefined;
  external?: boolean | undefined;
}

export interface LinkCardsProps {
  items: readonly LinkCard[];
  /** A heading over the cards, such as "Start here". */
  title?: ReactNode;
  /** `cards` for the main routes into the docs; `list` for many secondary links in less space. */
  variant?: 'cards' | 'list';
  columns?: 2 | 3;
  className?: string;
}

const COLUMNS = { 2: '@xl:grid-cols-2', 3: '@xl:grid-cols-2 @4xl:grid-cols-3' };

/**
 * Links to the main parts of the docs, as cards with an icon and a line on what each part covers,
 * or as a compact list. The whole card is the link; its title is the link's name.
 */
export function LinkCards({
  items,
  title,
  variant = 'cards',
  columns = 3,
  className,
}: LinkCardsProps) {
  const { Reveal } = useDocsParts();
  return (
    <section
      data-slot="link-cards"
      aria-label={typeof title === 'string' ? title : undefined}
      className={cn('@container flex flex-col gap-4', className)}
    >
      {title !== undefined && (
        <h2 className="font-display text-xl font-heading text-fg">{title}</h2>
      )}
      <Reveal
        as="ul"
        stagger
        className={cn(
          'grid',
          variant === 'cards' ? cn('gap-3', COLUMNS[columns]) : 'gap-x-8 @xl:grid-cols-2',
        )}
      >
        {items.map((item) => {
          const badge = badgeFrom(item.badge);
          return (
            <li key={item.href} className="flex">
              <DocsLink
                href={item.href}
                external={item.external}
                className={cn(
                  'group/card flex w-full gap-3.5 transition-colors duration-fast ease-standard',
                  variant === 'cards'
                    ? 'rounded-panel border border-line bg-surface p-4 sm:p-5 pointer-fine:hover:border-line-strong pointer-fine:hover:bg-surface-hover'
                    : 'border-b border-line py-3 pointer-fine:hover:text-accent-strong',
                  linkFocus,
                )}
              >
                {item.icon !== undefined && variant === 'cards' && (
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-control border border-line bg-surface-sunken text-accent-strong [&_svg]:size-5"
                  >
                    {item.icon}
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2 text-base font-strong text-fg">
                    {item.title}
                    {badge !== null && <DocsBadge tone={badge.tone}>{badge.label}</DocsBadge>}
                  </span>
                  {item.description !== undefined && (
                    <span className="text-sm text-pretty text-fg-muted">{item.description}</span>
                  )}
                </span>
                <ArrowRightIcon
                  aria-hidden
                  weight="bold"
                  className="mt-1 size-4 shrink-0 text-fg-subtle transition-transform duration-fast ease-standard pointer-fine:group-hover/card:translate-x-0.5 pointer-fine:group-hover/card:text-accent-strong rtl:-scale-x-100"
                />
              </DocsLink>
            </li>
          );
        })}
      </Reveal>
    </section>
  );
}

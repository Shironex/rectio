import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';
import { Anchor } from '../link/link';

export type CardVariant = 'outline' | 'raised' | 'sunken';

const VARIANTS: Record<CardVariant, string> = {
  outline: 'border border-line bg-surface shadow-panel translucent-surface',
  raised: 'border border-line bg-surface-raised shadow-raised translucent-surface',
  // A well inside a page or a panel: no edge, one step below the surface around it.
  sunken: 'bg-surface-sunken',
};

export interface CardProps extends ComponentProps<'div'> {
  variant?: CardVariant | undefined;
  /**
   * The whole card responds as one target: put a `CardLink` (or a button with `after:absolute
   * after:inset-0`) in the title. Hover lifts the edge; keyboard focus rings the whole card.
   */
  interactive?: boolean | undefined;
}

/**
 * A frame for one self-contained thing: a record, a plan, a document. Reach for it when the frame
 * says something (this is one unit, it can be picked); group plain content with space or a
 * Separator instead.
 */
export function Card({ variant = 'outline', interactive = false, className, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      data-interactive={interactive || undefined}
      className={cn(
        '@container relative flex min-w-0 flex-col rounded-panel text-fg',
        VARIANTS[variant],
        interactive && [
          'transition-[border-color,background-color,box-shadow,translate] duration-fast ease-standard',
          'hover:border-line-strong hover:bg-surface-raised',
          'has-[[data-slot=card-link]:active]:translate-y-px',
          'has-[[data-slot=card-link]:focus-visible]:outline-2 has-[[data-slot=card-link]:focus-visible]:outline-offset-2 has-[[data-slot=card-link]:focus-visible]:outline-focus',
        ],
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('grid grid-cols-1 items-start gap-x-4 gap-y-1 px-5 pt-4 last:pb-4', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        'col-start-1 font-display text-lg font-heading tracking-tight text-balance',
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-description"
      className={cn('col-start-1 text-sm text-fg-muted', className)}
      {...props}
    />
  );
}

/** Controls on the title's row, such as a menu or a badge. Sits above a stretched CardLink. */
export function CardAction({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'relative z-1 col-start-2 row-span-2 row-start-1 flex items-center gap-2 self-start',
        className,
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('flex flex-col gap-3 px-5 py-4 text-base', className)}
      {...props}
    />
  );
}

/** Actions or meta, end of the card. A hairline sets it apart from the content. */
export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'mt-auto flex flex-wrap items-center gap-2 border-t border-line px-5 py-3 text-sm text-fg-muted',
        className,
      )}
      {...props}
    />
  );
}

/**
 * The link of an interactive card. Its hit area stretches over the whole card, so the card is one
 * target with one accessible name (the link text) instead of a clickable div. It follows a
 * `LinkProvider`.
 */
export function CardLink({ className, href, ...props }: ComponentProps<'a'>) {
  const classes = cn(
    'outline-none after:absolute after:inset-0 after:rounded-panel hover:underline hover:decoration-line-strong hover:underline-offset-4',
    className,
  );
  if (href === undefined) return <a data-slot="card-link" className={classes} {...props} />;
  return <Anchor data-slot="card-link" href={href} className={classes} {...props} />;
}

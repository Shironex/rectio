import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

const SIZES: Record<EmptyStateSize, { box: string; title: string; icon: string }> = {
  sm: { box: 'gap-1 px-4 py-8', title: 'text-sm', icon: 'size-8 [&_svg]:size-4' },
  md: {
    box: 'gap-2 px-6 py-12',
    title: 'text-lg font-display tracking-tight',
    icon: 'size-11 [&_svg]:size-5',
  },
  lg: {
    box: 'gap-3 px-8 py-16',
    title: 'text-xl font-display tracking-tight',
    icon: 'size-14 [&_svg]:size-6',
  },
};

export interface EmptyStateProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** What is missing, in a few words: `No invoices yet`. */
  title: ReactNode;
  /** The next step, or why it is empty: `Invoices you send appear here.` */
  description?: ReactNode | undefined;
  /** An icon, drawn in a soft tile. */
  icon?: ReactNode | undefined;
  /** A larger picture in place of the icon tile, such as an illustration. */
  media?: ReactNode | undefined;
  /** The way out: usually one primary button, maybe a secondary link. */
  actions?: ReactNode | undefined;
  size?: EmptyStateSize | undefined;
  /** `dashed` frames the area it fills, for an empty slot inside a panel or a drop zone. */
  variant?: 'plain' | 'dashed' | undefined;
}

/**
 * What a screen, a panel or a list shows with nothing in it: what is missing and the next step,
 * so a first day reads as a starting point rather than a broken screen.
 */
export function EmptyState({
  title,
  description,
  icon,
  media,
  actions,
  size = 'md',
  variant = 'plain',
  className,
  ...props
}: EmptyStateProps) {
  const s = SIZES[size];
  return (
    <div
      data-slot="empty-state"
      data-size={size}
      className={cn(
        'flex flex-col items-center text-center text-sm text-fg-muted',
        s.box,
        variant === 'dashed' && 'rounded-control border border-dashed border-line',
        className,
      )}
      {...props}
    >
      {media ??
        (icon !== undefined && (
          <span
            aria-hidden
            className={cn(
              'mb-1 flex shrink-0 items-center justify-center rounded-panel border border-line bg-surface-sunken text-fg-subtle',
              s.icon,
            )}
          >
            {icon}
          </span>
        ))}
      <p className={cn('font-medium text-balance text-fg', s.title)}>{title}</p>
      {description !== undefined && <p className="max-w-sm text-pretty">{description}</p>}
      {actions !== undefined && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{actions}</div>
      )}
    </div>
  );
}

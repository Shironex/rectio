import { cn } from '@rectio/ui';
import { useId, type ComponentProps, type ReactNode } from 'react';

import { useBlockParts } from './block-parts';

export interface BlockPanelProps extends Omit<ComponentProps<'section'>, 'title'> {
  /** The block's name, a level-2 heading unless `headingLevel` says otherwise. */
  title: ReactNode;
  /** One line under the title: the period, the scope or the state of the data. */
  description?: ReactNode;
  /** Controls on the title's row, such as a period switch or the primary action. */
  actions?: ReactNode;
  headingLevel?: 2 | 3;
  /** Drop the frame (border, surface, padding) to place the block inside a frame of your own. */
  bare?: boolean;
  bodyClassName?: string;
}

/**
 * The frame every block shares: a hairline panel with a heading row. It names the section for
 * assistive technology through `aria-labelledby`, so a dashboard reads as a list of landmarks.
 */
export function BlockPanel({
  title,
  description,
  actions,
  headingLevel = 2,
  bare = false,
  className,
  bodyClassName,
  children,
  ...props
}: BlockPanelProps) {
  const { Reveal } = useBlockParts();
  const headingId = useId();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section
      aria-labelledby={headingId}
      data-slot="block"
      className={cn(
        '@container flex min-w-0 flex-col text-fg',
        !bare && 'rounded-panel border border-line bg-surface shadow-panel translucent-surface',
        className,
      )}
      {...props}
    >
      <header
        className={cn(
          'flex flex-wrap items-start justify-between gap-x-6 gap-y-3',
          !bare && 'px-5 pt-4',
        )}
      >
        {/* The title column takes the spare width and wraps its own text first, so a long
            description does not push the actions under it while there is room beside it. */}
        <div className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
          <Heading
            id={headingId}
            className="font-display text-lg font-heading tracking-tight text-balance"
          >
            {title}
          </Heading>
          {description !== undefined && <p className="text-sm text-fg-muted">{description}</p>}
        </div>
        {actions !== undefined && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </header>
      <Reveal
        className={cn('flex min-w-0 flex-1 flex-col', !bare && 'px-5 pt-4 pb-5', bodyClassName)}
      >
        {children}
      </Reveal>
    </section>
  );
}

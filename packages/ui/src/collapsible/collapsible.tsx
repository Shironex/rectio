import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { CaretRightIcon } from '@phosphor-icons/react';
import type { ComponentProps } from 'react';

import { disclosureCaret, disclosurePanelMotion } from '../accordion/accordion';
import { cn } from '../lib/cn';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

export type CollapsibleProps = WithClassName<ComponentProps<typeof BaseCollapsible.Root>>;

/** One section that shows and hides, such as advanced options or the lines behind a total. */
export function Collapsible({ className, ...props }: CollapsibleProps) {
  return (
    <BaseCollapsible.Root
      data-slot="collapsible"
      className={cn('flex flex-col', className)}
      {...props}
    />
  );
}

export type CollapsibleTriggerProps = WithClassName<
  ComponentProps<typeof BaseCollapsible.Trigger>
> & {
  /** Hide the caret, for a trigger drawn as a Button through `render`. */
  caret?: boolean | undefined;
};

/** A quiet row with a caret that turns. Pass `render={<Button />}` to draw it as a button. */
export function CollapsibleTrigger({
  className,
  caret = true,
  children,
  ...props
}: CollapsibleTriggerProps) {
  return (
    <BaseCollapsible.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        'group/trigger inline-flex w-fit cursor-pointer items-center gap-1.5 py-1 text-sm font-medium text-fg',
        'pointer-coarse:min-h-(--rx-control-height-touch)',
        'rounded-control outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        'hover:text-accent-strong',
        className,
      )}
      {...props}
    >
      {caret && (
        <CaretRightIcon
          aria-hidden
          weight="bold"
          className={cn(
            disclosureCaret,
            'size-3.5 group-data-panel-open/trigger:rotate-90 rtl:-scale-x-100',
          )}
        />
      )}
      {children}
    </BaseCollapsible.Trigger>
  );
}

export type CollapsiblePanelProps = WithClassName<ComponentProps<typeof BaseCollapsible.Panel>>;

export function CollapsiblePanel({ className, ...props }: CollapsiblePanelProps) {
  return (
    <BaseCollapsible.Panel
      data-slot="collapsible-panel"
      className={cn('text-sm text-fg-muted', disclosurePanelMotion, className)}
      {...props}
    />
  );
}

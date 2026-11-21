'use client';

import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { CaretDownIcon } from '@phosphor-icons/react';
import { createContext, use, type ComponentProps, type ReactNode } from 'react';

import { cn } from '../lib/cn';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

export type AccordionVariant = 'plain' | 'separated';

const VariantContext = createContext<AccordionVariant>('plain');

/**
 * Opening shows the content at once and fades it in: the panel never animates its height, so the
 * page below moves once, not for a quarter of a second. Closing is faster than opening.
 */
export const disclosurePanelMotion = cn(
  'transition-[opacity,translate] duration-base ease-enter',
  'data-starting-style:-translate-y-(--rx-motion-distance-shift) data-starting-style:opacity-0',
  'data-ending-style:opacity-0 data-ending-style:duration-fast data-ending-style:ease-exit',
);

/** The caret turns with the panel's state. */
export const disclosureCaret = cn(
  'size-4 shrink-0 text-fg-subtle transition-transform duration-base ease-standard',
  'motion-reduce:transition-none',
);

export type AccordionProps = WithClassName<ComponentProps<typeof BaseAccordion.Root>> & {
  /** `plain` divides items with hairlines; `separated` sets each item in its own frame. */
  variant?: AccordionVariant | undefined;
};

/**
 * Sections that open in place, such as FAQs or the settings of a rule. One open at a time by
 * default; `multiple` lets several stay open. Arrow keys move between headers.
 */
export function Accordion({ variant = 'plain', className, ...props }: AccordionProps) {
  return (
    <VariantContext value={variant}>
      <BaseAccordion.Root
        data-slot="accordion"
        data-variant={variant}
        className={cn('flex w-full flex-col', variant === 'separated' && 'gap-2', className)}
        {...props}
      />
    </VariantContext>
  );
}

export type AccordionItemProps = WithClassName<ComponentProps<typeof BaseAccordion.Item>>;

export function AccordionItem({ className, ...props }: AccordionItemProps) {
  const variant = use(VariantContext);
  return (
    <BaseAccordion.Item
      data-slot="accordion-item"
      className={cn(
        variant === 'plain'
          ? 'border-b border-line'
          : 'rounded-panel border border-line bg-surface px-4 data-open:bg-surface-raised',
        className,
      )}
      {...props}
    />
  );
}

export type AccordionTriggerProps = WithClassName<ComponentProps<typeof BaseAccordion.Trigger>> & {
  /** Secondary text at the end of the header, such as a count or a status. */
  hint?: ReactNode | undefined;
};

/** The header of an item: a heading holding a button, so it shows in the page outline. */
export function AccordionTrigger({ className, hint, children, ...props }: AccordionTriggerProps) {
  return (
    <BaseAccordion.Header className="m-0">
      <BaseAccordion.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'group/trigger flex w-full cursor-pointer items-center gap-3 py-3 text-start text-base font-medium text-fg',
          'pointer-coarse:min-h-(--rx-control-height-touch)',
          'rounded-control outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
          'hover:text-accent-strong data-disabled:cursor-not-allowed data-disabled:text-fg-disabled',
          className,
        )}
        {...props}
      >
        <span className="min-w-0 flex-1">{children}</span>
        {hint !== undefined && <span className="text-sm font-regular text-fg-subtle">{hint}</span>}
        <CaretDownIcon
          aria-hidden
          weight="bold"
          className={cn(disclosureCaret, 'group-data-panel-open/trigger:rotate-180')}
        />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}

export type AccordionPanelProps = WithClassName<ComponentProps<typeof BaseAccordion.Panel>>;

export function AccordionPanel({ className, children, ...props }: AccordionPanelProps) {
  return (
    <BaseAccordion.Panel
      data-slot="accordion-panel"
      className={cn('text-sm text-fg-muted', disclosurePanelMotion, className)}
      {...props}
    >
      <div className="pb-4">{children}</div>
    </BaseAccordion.Panel>
  );
}

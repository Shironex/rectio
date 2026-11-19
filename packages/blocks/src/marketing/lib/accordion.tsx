import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { PlusIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

/**
 * Questions that open in place. Internal to the marketing blocks until the kit's own Accordion
 * lands; swap it in then. Panels never animate their height: the answer fades in where it opens,
 * and closed answers stay findable with the browser's find in page.
 */
export interface AccordionEntry {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

export function Accordion({
  items,
  multiple = false,
  defaultOpen,
  headingLevel = 3,
  className,
}: {
  items: readonly AccordionEntry[];
  multiple?: boolean;
  defaultOpen?: string[];
  headingLevel?: 2 | 3 | 4;
  className?: string;
}) {
  const Heading = headingLevel === 2 ? 'h2' : headingLevel === 3 ? 'h3' : 'h4';
  return (
    <BaseAccordion.Root
      multiple={multiple}
      defaultValue={defaultOpen}
      hiddenUntilFound
      className={cn('flex flex-col border-t border-line', className)}
    >
      {items.map((item) => (
        <BaseAccordion.Item key={item.id} value={item.id} className="border-b border-line">
          <BaseAccordion.Header render={<Heading />} className="m-0">
            <BaseAccordion.Trigger
              className={cn(
                'group/trigger flex w-full cursor-pointer items-start justify-between gap-6 py-5 text-start',
                'text-lg font-medium text-fg',
                'rounded-control outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
              )}
            >
              <span className="text-pretty">{item.title}</span>
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-fg-muted',
                  'transition-[rotate,border-color,color] duration-base ease-standard',
                  'group-data-panel-open/trigger:rotate-45 group-data-panel-open/trigger:border-line-strong group-data-panel-open/trigger:text-fg',
                  'pointer-fine:group-hover/trigger:text-fg',
                )}
              >
                <PlusIcon weight="bold" className="size-3" />
              </span>
            </BaseAccordion.Trigger>
          </BaseAccordion.Header>
          <BaseAccordion.Panel
            className={cn(
              'transition-[opacity,translate] duration-slow ease-enter',
              'data-starting-style:-translate-y-(--rx-motion-distance-shift) data-starting-style:opacity-0',
              'data-ending-style:opacity-0 data-ending-style:duration-fast',
            )}
          >
            <div className="-mt-1 max-w-prose pe-12 pb-6 text-base text-pretty text-fg-muted">
              {item.content}
            </div>
          </BaseAccordion.Panel>
        </BaseAccordion.Item>
      ))}
    </BaseAccordion.Root>
  );
}

import { TextAlignLeftIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import { mergeMessages } from '../lib/messages';
import { linkFocus } from '../lib/link';
import { useDocsParts } from '../lib/parts';
import { scrollToHeading, useActiveHeading, type TocHeading } from './docs-toc.logic';

export interface DocsTocProps {
  headings: readonly TocHeading[];
  /** The heading above the list. Default "On this page". */
  title?: ReactNode;
  /**
   * Distance from the top of the viewport to the reading line, in pixels: the sticky header's
   * height plus a little air. Default 96.
   */
  offset?: number;
  /** Something under the list, such as "Edit this page" or a back to top link. */
  footer?: ReactNode;
  /** The block's words; pass the keys you change. See `DOCS_TOC_MESSAGES`. */
  messages?: Partial<DocsTocMessages>;
  className?: string;
}

export interface DocsTocMessages {
  /** The heading above the list. */
  title: string;
  /** Name of the navigation landmark. */
  label: string;
}

export const DOCS_TOC_MESSAGES: DocsTocMessages = {
  title: 'On this page',
  label: 'On this page',
};

/**
 * On this page: the page's headings with the one being read marked as you scroll. A link scrolls
 * smoothly to its heading (instantly under reduced motion), updates the address and moves focus,
 * so the next Tab continues from the section. Renders nothing for a page without headings.
 */
export function DocsToc({
  headings,
  title,
  offset = 96,
  footer,
  messages,
  className,
}: DocsTocProps) {
  const m = mergeMessages(DOCS_TOC_MESSAGES, messages);
  const { Marker } = useDocsParts();
  const active = useActiveHeading(
    headings.map((heading) => heading.id),
    offset,
  );
  const list = useRef<HTMLOListElement>(null);
  const [marker, setMarker] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const link = list.current?.querySelector<HTMLElement>('[aria-current="location"]');
    setMarker(link ? { top: link.offsetTop, height: link.offsetHeight } : null);
  }, [active, headings]);

  if (headings.length === 0) return null;
  return (
    <nav aria-label={m.label} data-slot="docs-toc" className={cn('flex flex-col gap-3', className)}>
      <p className="flex items-center gap-2 text-sm font-strong text-fg">
        <TextAlignLeftIcon aria-hidden weight="bold" className="size-4 text-fg-subtle" />
        {title ?? m.title}
      </p>
      <div className="relative">
        <span aria-hidden className="absolute inset-y-0 start-0 w-px bg-line" />
        {marker !== null && (
          <Marker
            top={marker.top}
            height={marker.height}
            className="absolute start-0 top-0 h-px w-0.5 origin-top bg-accent"
          />
        )}
        <ol ref={list} className="flex flex-col">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={heading.id === active ? 'location' : undefined}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)
                    return;
                  if (scrollToHeading(heading.id, offset)) event.preventDefault();
                }}
                className={cn(
                  'block py-1 text-sm text-pretty text-fg-muted transition-colors duration-fast ease-standard',
                  'pointer-fine:hover:text-fg aria-[current=location]:font-medium aria-[current=location]:text-fg',
                  'pointer-coarse:py-2.5',
                  heading.level === 2 ? 'ps-3' : heading.level === 3 ? 'ps-6' : 'ps-9',
                  linkFocus,
                )}
              >
                {heading.title}
              </a>
            </li>
          ))}
        </ol>
      </div>
      {footer}
    </nav>
  );
}

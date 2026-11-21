import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';
import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

export type ScrollAreaProps = WithClassName<ComponentProps<typeof BaseScrollArea.Root>> & {
  /** Which way the content scrolls. */
  orientation?: 'vertical' | 'horizontal' | 'both' | undefined;
  /** Fade the edges where more content waits, so it is clear the area scrolls. */
  fade?: boolean | undefined;
  /** Names the scrolling region, for a region that holds more than plain text. */
  label?: string | undefined;
  viewportClassName?: string | undefined;
  /**
   * When the scrollbar shows: `scroll` while scrolling or under the pointer, `always` whenever
   * the content overflows, so a short popup list says at rest that it scrolls.
   */
  scrollbar?: 'scroll' | 'always' | undefined;
  /**
   * Whether the viewport takes a Tab stop when it overflows, so keyboard users can scroll it.
   * Turn it off when the content is focusable itself, such as a tree or a listbox, whose focus
   * already scrolls the area: one stop instead of two.
   */
  focusableViewport?: boolean | undefined;
};

function Scrollbar({
  orientation,
  always,
}: {
  orientation: 'vertical' | 'horizontal';
  always: boolean;
}) {
  return (
    <BaseScrollArea.Scrollbar
      orientation={orientation}
      className={cn(
        'flex touch-none p-0.5 select-none',
        // Thin and faint at rest; it shows while scrolling or under the pointer, and widens on hover.
        always ? 'opacity-100' : 'opacity-0 transition-opacity duration-base ease-standard',
        'data-hovering:opacity-100 data-scrolling:opacity-100 data-scrolling:duration-fast',
        orientation === 'vertical' ? 'w-2.5 hover:w-3' : 'h-2.5 flex-col hover:h-3',
      )}
    >
      <BaseScrollArea.Thumb className="flex-1 rounded-full bg-line-strong/70 hover:bg-fg-subtle" />
    </BaseScrollArea.Scrollbar>
  );
}

/**
 * A region with its own scroll and a quiet, themed scrollbar, such as a long list in a side panel.
 * Native scrolling underneath: wheel, touch, keyboard and find-in-page all work.
 */
export function ScrollArea({
  orientation = 'vertical',
  fade = true,
  label,
  className,
  viewportClassName,
  scrollbar = 'scroll',
  focusableViewport = true,
  children,
  ...props
}: ScrollAreaProps) {
  const always = scrollbar === 'always';
  return (
    <BaseScrollArea.Root
      data-slot="scroll-area"
      className={cn('relative flex min-h-0 overflow-hidden', className)}
      {...props}
    >
      <BaseScrollArea.Viewport
        aria-label={label}
        role={label === undefined ? undefined : 'region'}
        {...(focusableViewport ? {} : { tabIndex: -1 })}
        className={cn(
          'min-h-0 flex-1 overscroll-contain outline-none',
          'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus',
          fade && [
            'data-overflow-y-start:mask-t-from-85% data-overflow-y-end:mask-b-from-85%',
            'data-overflow-x-start:mask-l-from-90% data-overflow-x-end:mask-r-from-90%',
          ],
          viewportClassName,
        )}
      >
        <BaseScrollArea.Content className={cn(orientation !== 'vertical' && 'min-w-fit')}>
          {children}
        </BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      {orientation !== 'horizontal' && <Scrollbar orientation="vertical" always={always} />}
      {orientation !== 'vertical' && <Scrollbar orientation="horizontal" always={always} />}
      {orientation === 'both' && <BaseScrollArea.Corner />}
    </BaseScrollArea.Root>
  );
}

import type { ComponentProps, CSSProperties } from 'react';

import { cn } from '../lib/cn';
import { Skeleton, SkeletonCircle, SkeletonLine } from '../skeleton/skeleton';

export type ChatLoaderVariant = 'typing' | 'skeleton';

export interface ChatLoaderProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * `typing`: three dots, for the moment between sending and the first words. `skeleton`: the
   * shape of a reply, for a thread that is loading its history.
   */
  variant?: ChatLoaderVariant | undefined;
  /** What a screen reader hears. Default "Assistant is typing" or "Loading messages". */
  label?: string | undefined;
  /** Lines in the skeleton reply. Default 3. */
  lines?: number | undefined;
}

/** The n-th dot starts this far into the cycle, so the three are already moving on the first frame. */
const phase = (share: number): CSSProperties => ({
  animationDelay: `calc(var(--rx-motion-duration-loop) * ${String(-share)})`,
});

/** The widths of the skeleton lines, uneven like real sentences. */
const WIDTHS = ['full', '3/4', 'full', '1/2'] as const;

/**
 * Says the assistant is working. The typing dots sit where the reply will appear, in a bubble the
 * reply's size; the skeleton draws the outline of a reply while history loads. Both are a polite
 * status, so a screen reader hears the label once, and under reduced motion the dots breathe in
 * place instead of hopping.
 */
export function ChatLoader({
  variant = 'typing',
  label,
  lines = 3,
  className,
  ...props
}: ChatLoaderProps) {
  if (variant === 'skeleton') {
    return (
      <div
        role="status"
        aria-busy="true"
        data-slot="chat-loader"
        data-variant="skeleton"
        className={cn('flex w-full gap-3', className)}
        {...props}
      >
        <span className="sr-only">{label ?? 'Loading messages'}</span>
        <SkeletonCircle size="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: Math.max(1, lines) }, (_, index) => (
            <SkeletonLine
              // Lines are positional.
              key={index}
              width={WIDTHS[index % WIDTHS.length] ?? 'full'}
            />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div
      role="status"
      data-slot="chat-loader"
      data-variant="typing"
      className={cn(
        'inline-flex h-8 w-fit items-center gap-1 rounded-panel bg-surface-sunken px-3 text-fg-subtle',
        className,
      )}
      {...props}
    >
      <span className="sr-only">{label ?? 'Assistant is typing'}</span>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          aria-hidden
          className="size-1.5 rounded-full bg-current animate-dot motion-reduce:animate-breathe"
          style={phase(1.4 - index * 0.18)}
        />
      ))}
    </div>
  );
}

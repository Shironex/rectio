import { PauseIcon, PlayIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useState, type ReactNode } from 'react';

/**
 * A strip that scrolls sideways forever: the items are drawn twice end to end and the track moves
 * by half its width, so the loop has no seam. It stops on hover and keyboard focus, has a pause
 * button (moving content longer than five seconds must be stoppable), and under reduced motion it
 * does not move at all: the items wrap onto as many rows as they need instead.
 */
export function Marquee({
  children,
  label,
  reverse = false,
  className,
  itemClassName,
}: {
  /** The items, each one child. */
  children: ReactNode[];
  /** Names the strip and its pause button, such as "Customer logos". */
  label: string;
  /** Scroll the other way, for a second row under the first. */
  reverse?: boolean;
  className?: string;
  itemClassName?: string;
}) {
  const [paused, setPaused] = useState(false);
  const items = (copy: number) =>
    children.map((child, index) => (
      // The order of a copy never changes, so the index is a stable key.
      <li key={`${String(copy)}-${String(index)}`} className={cn('shrink-0', itemClassName)}>
        {child}
      </li>
    ));
  return (
    <div
      role="region"
      aria-label={label}
      data-paused={paused || undefined}
      className={cn('group/marquee relative flex items-center gap-3', className)}
    >
      <div className="min-w-0 flex-1 overflow-hidden mask-x-from-90% mask-x-to-100% motion-reduce:mask-none">
        <div
          className={cn(
            'flex w-max animate-marquee',
            reverse && 'playback-reverse',
            'group-hover/marquee:playback-paused group-focus-within/marquee:playback-paused group-data-paused/marquee:playback-paused',
            'motion-reduce:w-auto motion-reduce:animate-none',
          )}
        >
          <ul className="flex shrink-0 items-center gap-12 pe-12 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6">
            {items(0)}
          </ul>
          {/* The second copy is only there to close the loop: hidden from assistive technology. */}
          <ul aria-hidden className="flex shrink-0 items-center gap-12 pe-12 motion-reduce:hidden">
            {items(1)}
          </ul>
        </div>
      </div>
      <button
        type="button"
        aria-pressed={paused}
        aria-label={`Pause ${label}`}
        onClick={() => {
          setPaused((value) => !value);
        }}
        className={cn(
          'relative inline-flex size-(--rx-button-height-sm) shrink-0 cursor-pointer items-center justify-center rounded-full text-fg-subtle',
          'transition-colors duration-fast ease-standard pointer-fine:hover:bg-surface-hover pointer-fine:hover:text-fg',
          'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus motion-reduce:hidden',
          'pointer-coarse:after:absolute pointer-coarse:after:size-(--rx-button-height-touch)',
        )}
      >
        {paused ? (
          <PlayIcon aria-hidden weight="fill" className="size-3.5" />
        ) : (
          <PauseIcon aria-hidden weight="fill" className="size-3.5" />
        )}
      </button>
    </div>
  );
}

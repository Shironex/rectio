import { SkeletonSwap as PlainSkeletonSwap, cn, type SkeletonSwapProps } from '@rectio/ui';
import { useLayoutEffect, useRef, useState } from 'react';

import { cssEasing } from '../lib/first-view';
import { usePlainMotion } from '../lib/mode';
import { readMotionTokens } from '../lib/tokens';

export type { SkeletonSwapProps };

/**
 * The placeholder and the content share one grid cell. When loading ends, the content arrives,
 * sharpening from a slight blur as it fades in, while the placeholder fades out over it a little
 * faster; the blur bridges the two so they read as one surface resolving, not two swapping.
 */
function MotionSkeletonSwap({ loading, fallback, children, className }: SkeletonSwapProps) {
  const [leaving, setLeaving] = useState(false);
  const [wasLoading, setWasLoading] = useState(loading);
  const content = useRef<HTMLDivElement>(null);
  const placeholder = useRef<HTMLDivElement>(null);
  // Follows the prop while rendering: the frame that drops `loading` already holds both layers.
  if (wasLoading !== loading) {
    setWasLoading(loading);
    setLeaving(!loading);
  }

  useLayoutEffect(() => {
    const incoming = content.current;
    const outgoing = placeholder.current;
    if (!leaving || incoming === null || outgoing === null) return;
    const tokens = readMotionTokens(incoming);
    const slow = (tokens?.duration.slow ?? 0) * 1000;
    const enter = incoming.animate(
      [
        { opacity: 0, filter: 'blur(4px)' },
        { opacity: 1, filter: 'blur(0)' },
      ],
      { duration: slow, easing: cssEasing(incoming, 'enter') },
    );
    const exit = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: (tokens?.duration.base ?? 0) * 1000,
      easing: cssEasing(outgoing, 'standard'),
      fill: 'forwards',
    });
    exit.onfinish = () => {
      setLeaving(false);
    };
    return () => {
      exit.onfinish = null;
      enter.cancel();
      exit.cancel();
    };
  }, [leaving]);

  return (
    <div
      data-slot="skeleton-swap"
      data-motion=""
      aria-busy={loading || undefined}
      className={cn('grid', className)}
    >
      {!loading && (
        <div ref={content} className="col-start-1 row-start-1 min-w-0">
          {children}
        </div>
      )}
      {(loading || leaving) && (
        <div
          ref={placeholder}
          aria-hidden={loading ? undefined : true}
          className={cn('col-start-1 row-start-1 min-w-0', !loading && 'pointer-events-none')}
        >
          {fallback}
        </div>
      )}
    </div>
  );
}

/** SkeletonSwap that resolves the placeholder into the content. Plain under reduced motion. */
export function SkeletonSwap(props: SkeletonSwapProps) {
  const plain = usePlainMotion();
  return plain ? <PlainSkeletonSwap {...props} /> : <MotionSkeletonSwap {...props} />;
}

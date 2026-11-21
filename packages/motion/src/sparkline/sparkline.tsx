import { Sparkline as PlainSparkline, type SparklineProps } from '@rectio/ui';
import { useRef } from 'react';

import { cssEasing, useFirstView } from '../lib/first-view';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export type { SparklineProps };

/** Uncovers the line from left to right, then lets the latest dot appear where it ends. */
function draw(root: Element): (() => void) | undefined {
  const tokens = readMotionTokens(root);
  if (tokens === null) return undefined;
  const running: Animation[] = [];
  const duration = tokens.duration.count * 1000;
  for (const line of root.querySelectorAll<SVGElement>('[data-part="line"]')) {
    running.push(
      line.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
        duration,
        easing: cssEasing(root, 'settle'),
        fill: 'backwards',
      }),
    );
  }
  for (const dot of root.querySelectorAll<HTMLElement>('[data-part="dot"]')) {
    running.push(
      dot.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: tokens.duration.base * 1000,
        delay: duration * 0.8,
        easing: cssEasing(root, 'enter'),
        fill: 'backwards',
      }),
    );
  }
  return () => {
    for (const animation of running) animation.cancel();
  };
}

/** A sparkline that draws itself along time the first time it is seen. Same props; plain under reduced motion. */
export function Sparkline({ ref, ...props }: SparklineProps) {
  const plain = usePlainMotion();
  const node = useRef<HTMLSpanElement>(null);
  useFirstView(node, draw, !plain);
  return (
    <PlainSparkline
      {...props}
      ref={(element: HTMLSpanElement | null) => {
        node.current = element;
        assignRef(ref, element);
      }}
    />
  );
}

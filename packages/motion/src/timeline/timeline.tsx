import {
  Timeline as PlainTimeline,
  TimelineItem,
  type TimelineItemProps,
  type TimelineProps,
} from '@rectio/ui';
import { useRef } from 'react';

import { cssEasing, useFirstView } from '../lib/first-view';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export { TimelineItem, type TimelineItemProps, type TimelineProps };

/** Steps between items: about the stagger token, varied so the cascade never ticks like a clock. */
const RHYTHM = [0, 1, 2.2, 3.1, 4.4, 5.2, 6.5, 7.3];

function cascade(list: Element): (() => void) | undefined {
  const tokens = readMotionTokens(list);
  if (tokens === null) return undefined;
  const items = [...list.querySelectorAll<HTMLElement>(':scope > [data-slot="timeline-item"]')];
  const running = items.map((item, i) =>
    item.animate(
      [
        { opacity: 0, transform: `translateY(${tokens.distance.shift})` },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: tokens.duration.slow * 1000,
        // Past the eighth item the rest arrive together: a long feed is never a slow reveal.
        delay: (RHYTHM[Math.min(i, RHYTHM.length - 1)] ?? 0) * tokens.duration.base * 300,
        easing: cssEasing(list, 'enter'),
        fill: 'backwards',
      },
    ),
  );
  return () => {
    for (const animation of running) animation.cancel();
  };
}

/**
 * A timeline whose events arrive one after another, top first, the first time it is seen. Use
 * with the plain TimelineItem. Same props; plain under reduced motion.
 */
export function Timeline({ ref, ...props }: TimelineProps) {
  const plain = usePlainMotion();
  const node = useRef<HTMLOListElement>(null);
  useFirstView(node, cascade, !plain);
  return (
    <PlainTimeline
      {...props}
      data-motion={plain ? undefined : ''}
      ref={(element: HTMLOListElement | null) => {
        node.current = element;
        assignRef(ref, element);
      }}
    />
  );
}

import {
  ProgressCircle as PlainProgressCircle,
  Progress as PlainProgress,
  type ProgressCircleProps,
  type ProgressProps,
} from '@rectio/ui';
import { useRef } from 'react';

import { useFirstView } from '../lib/first-view';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { sweepIn } from '../lib/sweep';

export type { ProgressCircleProps, ProgressProps };

/**
 * Progress whose fill grows from empty to its value the first time it is seen, segments one after
 * another. Later changes keep the plain transition. Same props; plain under reduced motion.
 */
export function Progress({ ref, ...props }: ProgressProps) {
  const plain = usePlainMotion();
  const node = useRef<HTMLDivElement>(null);
  useFirstView(node, sweepIn, !plain && props.value !== null);
  return (
    <PlainProgress
      {...props}
      data-motion={plain ? undefined : ''}
      ref={(element: HTMLDivElement | null) => {
        node.current = element;
        assignRef(ref, element);
      }}
    />
  );
}

/**
 * A ring that sweeps from empty to its value the first time it is seen, the figure fading up as
 * the arc lands. Same props; plain under reduced motion.
 */
export function ProgressCircle({ ref, ...props }: ProgressCircleProps) {
  const plain = usePlainMotion();
  const node = useRef<HTMLDivElement>(null);
  useFirstView(node, sweepIn, !plain && props.value !== null);
  return (
    <PlainProgressCircle
      {...props}
      data-motion={plain ? undefined : ''}
      ref={(element: HTMLDivElement | null) => {
        node.current = element;
        assignRef(ref, element);
      }}
    />
  );
}

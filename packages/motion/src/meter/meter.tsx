import { Meter as PlainMeter, type MeterProps } from '@rectio/ui';
import { useRef } from 'react';

import { useFirstView } from '../lib/first-view';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { sweepIn } from '../lib/sweep';

export type { MeterProps };

/**
 * A meter whose gauge or bar sweeps up to the reading the first time it is seen. Same props;
 * plain under reduced motion.
 */
export function Meter({ ref, ...props }: MeterProps) {
  const plain = usePlainMotion();
  const node = useRef<HTMLDivElement>(null);
  useFirstView(node, sweepIn, !plain);
  return (
    <PlainMeter
      {...props}
      data-motion={plain ? undefined : ''}
      ref={(element: HTMLDivElement | null) => {
        node.current = element;
        assignRef(ref, element);
      }}
    />
  );
}

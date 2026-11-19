import { Banner as PlainBanner, type BannerProps } from '@rectio/ui';
import { useRef, useState } from 'react';

import { usePlainMotion } from '../lib/mode';
import { usePresence } from '../lib/presence';
import { assignRef } from '../lib/ref';

export type { BannerProps };

function MotionBanner({ ref, open, onDismiss, ...props }: BannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const node = useRef<HTMLElement>(null);
  const shown = usePresence(open ?? !dismissed, node);
  return (
    <PlainBanner
      {...props}
      data-motion=""
      open={shown}
      onDismiss={() => {
        setDismissed(true);
        onDismiss?.();
      }}
      ref={(element: HTMLElement | null) => {
        node.current = element;
        assignRef(ref, element);
      }}
    />
  );
}

/** A Banner that lifts away when dismissed. Same props; plain under reduced motion. */
export function Banner(props: BannerProps) {
  const plain = usePlainMotion();
  return plain ? <PlainBanner {...props} /> : <MotionBanner {...props} />;
}

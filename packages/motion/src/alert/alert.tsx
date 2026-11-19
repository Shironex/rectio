import { Alert as PlainAlert, cn, type AlertProps } from '@rectio/ui';
import { useRef, useState } from 'react';

import { usePlainMotion } from '../lib/mode';
import { usePresence } from '../lib/presence';
import { assignRef } from '../lib/ref';

export type { AlertProps };

function MotionAlert({ ref, open, onDismiss, className, ...props }: AlertProps) {
  const [dismissed, setDismissed] = useState(false);
  const node = useRef<HTMLDivElement>(null);
  const shown = usePresence(open ?? !dismissed, node);
  return (
    <PlainAlert
      {...props}
      data-motion=""
      open={shown}
      onDismiss={() => {
        setDismissed(true);
        onDismiss?.();
      }}
      className={cn(
        // An alert that arrives while the page is open rises in; one that is there from the start
        // does not move.
        props.live !== undefined &&
          'transition-[opacity,translate] duration-slow ease-enter starting:translate-y-(--rx-motion-distance-shift) starting:opacity-0',
        className,
      )}
      ref={(element: HTMLDivElement | null) => {
        node.current = element;
        assignRef(ref, element);
      }}
    />
  );
}

/**
 * An Alert that lifts away when dismissed instead of vanishing, and rises in when it arrives live.
 * Same props; plain under reduced motion.
 */
export function Alert(props: AlertProps) {
  const plain = usePlainMotion();
  return plain ? <PlainAlert {...props} /> : <MotionAlert {...props} />;
}

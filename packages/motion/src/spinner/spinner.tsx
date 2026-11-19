import { LoadingOverlay as PlainLoadingOverlay, type LoadingOverlayProps } from '@rectio/ui';
import { useRef } from 'react';

import { usePlainMotion } from '../lib/mode';
import { usePresence } from '../lib/presence';
import { assignRef } from '../lib/ref';

export type { LoadingOverlayProps };

function MotionLoadingOverlay({ ref, visible, ...props }: LoadingOverlayProps) {
  const node = useRef<HTMLDivElement>(null);
  const shown = usePresence(visible, node);
  return (
    <PlainLoadingOverlay
      {...props}
      data-motion=""
      visible={shown}
      ref={(element: HTMLDivElement | null) => {
        node.current = element;
        assignRef(ref, element);
      }}
    />
  );
}

/**
 * A LoadingOverlay that fades away when the section is ready instead of cutting out. The entrance
 * is the plain one: a delayed fade, so fast reloads never show it. Plain under reduced motion.
 */
export function LoadingOverlay(props: LoadingOverlayProps) {
  const plain = usePlainMotion();
  return plain ? <PlainLoadingOverlay {...props} /> : <MotionLoadingOverlay {...props} />;
}

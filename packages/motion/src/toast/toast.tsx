import {
  ToastProvider as PlainToastProvider,
  cn,
  useToast,
  type ToastProviderProps,
  type ToastType,
} from '@rectio/ui';
import { useCallback } from 'react';

import { tweenTo, type Controls } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export { useToast, type ToastProviderProps, type ToastType };

/**
 * Enter and exit stay CSS transitions, so a toast added while another is still arriving retargets
 * from where it is instead of restarting. Arrives from further below on the slow duration with an
 * ease-out; leaves faster, dropping a little toward the corner. The exit takes the enter easing on
 * purpose: the exit token is an ease-in curve, which reads as sluggish for something that leaves.
 * Swipes keep the plain toast's own exit along the swipe.
 */
const MOTION_TOAST = cn(
  'duration-slow',
  'data-starting-style:translate-y-(--rx-motion-distance-origin)',
  'data-ending-style:translate-y-(--rx-motion-distance-shift) data-ending-style:ease-enter',
);

/** The vertical offset an element is drawn at by its transform (not `translate`), in pixels. */
function transformY(element: HTMLElement): number {
  const transform = getComputedStyle(element).transform;
  if (transform === 'none' || typeof DOMMatrixReadOnly === 'undefined') return 0;
  return new DOMMatrixReadOnly(transform).m42;
}

/**
 * When a toast arrives, leaves or is let through by the limit, the others glide to their new place
 * instead of jumping (a FLIP on transform only). Each glide starts from where the toast is drawn
 * now, so a second toast added mid glide continues the motion instead of snapping back first.
 */
function useStackReflow(on: boolean) {
  return useCallback(
    (viewport: HTMLDivElement | null) => {
      if (!on || viewport === null) return;
      const resting = new Map<HTMLElement, number>();
      const running = new Map<HTMLElement, Controls>();
      const toasts = () =>
        [...viewport.querySelectorAll<HTMLElement>(':scope > [data-slot="toast"]')].filter(
          (toast) => toast.offsetParent !== null,
        );
      // Layout position on the page, untouched by transforms in flight. The viewport is anchored to
      // the bottom and grows upward, so a toast's offset inside it can stay the same while the toast
      // moves: the viewport's own offset is added.
      const place = (toast: HTMLElement) => viewport.offsetTop + toast.offsetTop;
      const record = () => {
        resting.clear();
        for (const toast of toasts()) resting.set(toast, place(toast));
      };
      record();

      // Runs after the DOM changed and before the frame is painted, so no jump is ever drawn.
      const observer = new MutationObserver(() => {
        const tokens = readMotionTokens(viewport);
        if (tokens === null) {
          record();
          return;
        }
        for (const toast of toasts()) {
          const before = resting.get(toast);
          const now = place(toast);
          if (before === undefined || before === now) continue;
          // Where it is drawn now: its old place plus what is left of a glide in flight.
          const from = before + transformY(toast) - now;
          running.get(toast)?.stop();
          running.set(
            toast,
            tweenTo(
              toast,
              { transform: [`translateY(${String(from)}px)`, 'translateY(0px)'] },
              tokens.duration.slow,
              tokens.easing.standard,
            ),
          );
        }
        record();
      });
      observer.observe(viewport, {
        childList: true,
        subtree: true,
        attributeFilter: ['data-limited'],
      });
      return () => {
        observer.disconnect();
        for (const controls of running.values()) controls.stop();
      };
    },
    [on],
  );
}

/**
 * ToastProvider with a calm entrance and exit and a stack that reflows smoothly. Same props and
 * the same `useToast` as the plain one; under reduced motion, or with motion turned off, it is the
 * plain one (a fade in place).
 */
export function ToastProvider({ toastClassName, viewportRef, ...props }: ToastProviderProps) {
  const plain = usePlainMotion();
  const reflow = useStackReflow(!plain);
  // Stable across renders: a new ref each render would detach the observer, and with it the
  // mutation records of the very toast that caused the render.
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      const cleanup = reflow(node);
      assignRef(viewportRef, node);
      return () => {
        cleanup?.();
        assignRef(viewportRef, null);
      };
    },
    [reflow, viewportRef],
  );
  if (plain)
    return (
      <PlainToastProvider {...props} toastClassName={toastClassName} viewportRef={viewportRef} />
    );
  return (
    <PlainToastProvider
      {...props}
      toastClassName={cn(MOTION_TOAST, toastClassName)}
      viewportRef={ref}
    />
  );
}

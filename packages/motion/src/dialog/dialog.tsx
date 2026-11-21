import {
  Dialog,
  DialogContent as PlainDialogContent,
  DialogTrigger,
  cn,
  type DialogContentProps,
} from '@rectio/ui';
import { useLayoutEffect, useRef, type ComponentProps } from 'react';

import { springTo, tweenTo, type Controls } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export type { DialogContentProps };

/**
 * The root and the trigger are the plain ones: a dialog is not anchored to its trigger, so it
 * opens where it will be read, in the centre, and nothing needs to know where the click came from.
 */
export { Dialog, DialogTrigger };

type PopupState = Parameters<
  Extract<DialogContentProps['render'], (...args: never[]) => unknown>
>[1];

/**
 * Opens centred: grows from the `dialog` scale on the overlay spring while it turns opaque within
 * the fast duration. Closes faster than it opened, on a tween with the exit easing (never the
 * opening spring), back to the same scale and transparent.
 *
 * Interruptible: reopening mid close (or closing mid open) starts from where the popup is drawn,
 * not from the far end. The animations are Web Animations, which Base UI waits for before it
 * unmounts the popup and calls `onOpenChangeComplete`, so content stays intact until the exit ends.
 */
export function MotionPopup({
  state,
  ref,
  ...props
}: ComponentProps<'div'> & { state: PopupState }) {
  const node = useRef<HTMLDivElement | null>(null);
  const running = useRef<Controls[]>([]);

  useLayoutEffect(() => {
    const element = node.current;
    if (element === null) return;
    const tokens = readMotionTokens(element);
    if (tokens === null) return;
    const away = `scale(${String(tokens.scale.dialog)})`;
    // The first opening starts from away; every later movement from the frame on screen, which is
    // mid flight when it interrupts the last one.
    const first = running.current.length === 0;
    const now = getComputedStyle(element);
    const from = first
      ? { transform: away, opacity: '0' }
      : { transform: now.transform, opacity: now.opacity };
    for (const controls of running.current) controls.stop();
    element.style.removeProperty('transform');
    element.style.removeProperty('opacity');
    const { fast } = tokens.duration;
    running.current = state.open
      ? [
          springTo(element, { transform: [from.transform, 'none'] }, tokens.spring.overlay),
          // Opaque within the fast duration, so page text never shows through the card for long.
          tweenTo(element, { opacity: [from.opacity, 1] }, fast, tokens.easing.enter),
        ]
      : [
          tweenTo(element, { transform: [from.transform, away] }, fast, tokens.easing.exit),
          tweenTo(element, { opacity: [from.opacity, 0] }, fast, tokens.easing.exit),
        ];
  }, [state.open]);

  return (
    <div
      ref={(value) => {
        node.current = value;
        assignRef(ref, value);
      }}
      {...props}
    />
  );
}

/**
 * The CSS entrance of the plain popup is replaced by the script one. Transitions must go: a running
 * CSS transition outranks a Web Animation in the cascade. The ending opacity stays, so the popup is
 * already invisible in the frame its exit animation ends.
 */
export const REPLACES_CSS_MOTION = cn(
  'origin-center transition-none',
  'data-starting-style:translate-y-0 data-starting-style:scale-100 data-starting-style:opacity-100',
);

/**
 * DialogContent that opens centred with a short spring and closes on a faster tween. Same props as
 * the plain one; under reduced motion it is the plain one (a fade in place).
 */
export function DialogContent({ className, ...props }: DialogContentProps) {
  const plain = usePlainMotion();
  if (plain)
    return <PlainDialogContent {...props} {...(className === undefined ? {} : { className })} />;
  return (
    <PlainDialogContent
      {...props}
      data-motion=""
      className={cn(REPLACES_CSS_MOTION, className)}
      render={(popupProps, state) => <MotionPopup {...popupProps} state={state} />}
    />
  );
}

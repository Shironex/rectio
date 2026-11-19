import { cn } from '@rectio/ui';
import { useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react';

import { springTo, tweenTo, type Controls } from './animate';
import { useGlidingHighlight } from './glide';
import { assignRef } from './ref';
import { readMotionTokens } from './tokens';

/** What a list popup's render function is told: only whether it is open matters here. */
export interface PopupState {
  open: boolean;
}

export type MotionPopupProps = ComponentProps<'div'> & {
  state: PopupState;
  /** The `data-slot` of the list's options, such as `select-item`. */
  itemSlot: string;
  children?: ReactNode;
};

/**
 * A list popup that springs out of its trigger (Base UI's `--transform-origin`), fades away faster
 * and has the gliding highlight.
 * Pass it as the `render` of a Base UI popup; Base UI waits for the exit before it unmounts.
 */
export function MotionPopup({ state, itemSlot, ref, children, ...props }: MotionPopupProps) {
  const node = useRef<HTMLDivElement | null>(null);
  const running = useRef<Controls[]>([]);
  const highlight = useGlidingHighlight(node, state.open, itemSlot);

  useLayoutEffect(() => {
    const element = node.current;
    if (element === null) return;
    const tokens = readMotionTokens(element);
    if (tokens === null) return;
    const away = `translateY(-${tokens.distance.shift}) scale(${String(tokens.scale.from)})`;
    // The first opening starts from away; a reopening mid close starts from the frame on screen.
    const first = running.current.length === 0;
    const now = getComputedStyle(element);
    const from = first
      ? { transform: away, opacity: '0' }
      : { transform: now.transform, opacity: now.opacity };
    for (const controls of running.current) controls.stop();
    running.current = state.open
      ? [
          // Scales from the trigger: the plain popup's origin is Base UI's --transform-origin.
          springTo(element, { transform: [from.transform, 'none'] }, tokens.spring.overlay),
          tweenTo(
            element,
            { opacity: [from.opacity, 1] },
            tokens.duration.base,
            tokens.easing.enter,
          ),
        ]
      : [
          tweenTo(
            element,
            { opacity: [from.opacity, 0] },
            tokens.duration.fast,
            tokens.easing.exit,
          ),
        ];
  }, [state.open]);

  return (
    <div
      ref={(value) => {
        node.current = value;
        assignRef(ref, value);
      }}
      {...props}
    >
      <span
        ref={highlight}
        aria-hidden
        data-part="highlight"
        className="pointer-events-none absolute inset-x-1 top-0 rounded-(--rx-field-radius) bg-accent-subtle opacity-0"
      />
      {children}
    </div>
  );
}

/** Turns off the plain popup's CSS entrance so only the spring runs. */
export const REPLACES_CSS_MOTION = cn(
  'relative transition-none',
  'data-starting-style:translate-y-0 data-starting-style:scale-100 data-starting-style:opacity-100',
);

/** An option that lets the list's gliding highlight show through its own. */
export const GLIDING_ITEM = 'relative data-highlighted:bg-transparent';

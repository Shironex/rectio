import { cn } from '@rectio/ui';
import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react';

import { springTo, tweenTo, type Controls } from './animate';
import { assignRef } from './ref';
import { readMotionTokens, type MotionTokens } from './tokens';

/**
 * The CSS entrance of a plain anchored popup is replaced by the script one. Transitions must go: a
 * running CSS transition outranks a Web Animation in the cascade.
 */
export const REPLACES_POPUP_CSS = cn(
  'transition-none',
  'data-starting-style:translate-y-0 data-starting-style:scale-100 data-starting-style:opacity-100',
);

/** Where the popup starts: pulled a short way back toward its trigger, slightly smaller. */
function away(element: HTMLElement, tokens: MotionTokens) {
  const shift = tokens.distance.shift;
  const scale = String(tokens.scale.from);
  const side = element.closest('[data-side]')?.getAttribute('data-side') ?? 'bottom';
  const rtl = getComputedStyle(element).direction === 'rtl';
  const physical =
    side === 'inline-end'
      ? rtl
        ? 'left'
        : 'right'
      : side === 'inline-start'
        ? rtl
          ? 'right'
          : 'left'
        : side;
  const offset =
    physical === 'top'
      ? `translateY(${shift})`
      : physical === 'left'
        ? `translateX(${shift})`
        : physical === 'right'
          ? `translateX(-${shift})`
          : `translateY(-${shift})`;
  return `${offset} scale(${scale})`;
}

/**
 * Springs an anchored popup out of its trigger's side when it opens and fades it when it closes,
 * picking up from wherever it is if interrupted. The transform origin is Base UI's
 * `--transform-origin`, set by the plain popup's classes.
 */
export function useAnchoredEntrance(node: RefObject<HTMLElement | null>, open: boolean) {
  const running = useRef<Controls[]>([]);
  useLayoutEffect(() => {
    const element = node.current;
    if (element === null) return;
    const tokens = readMotionTokens(element);
    if (tokens === null) return;
    const opacity = getComputedStyle(element).opacity;
    for (const controls of running.current) controls.stop();
    running.current = open
      ? [
          springTo(element, { transform: [away(element, tokens), 'none'] }, tokens.spring.overlay),
          tweenTo(element, { opacity: [0, 1] }, tokens.duration.fast, tokens.easing.enter),
        ]
      : [tweenTo(element, { opacity: [opacity, 0] }, tokens.duration.fast, tokens.easing.exit)];
  }, [node, open]);
}

/** A popup element with the anchored entrance, for a Base UI `render` prop. */
export function AnchoredPopup({
  open,
  ref,
  children,
  ...props
}: ComponentProps<'div'> & { open: boolean; children?: ReactNode }) {
  const node = useRef<HTMLDivElement | null>(null);
  useAnchoredEntrance(node, open);
  return (
    <div
      ref={(value) => {
        node.current = value;
        assignRef(ref, value);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

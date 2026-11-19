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
import { readMotionTokens } from './tokens';

/** What a list popup's render function is told: only whether it is open matters here. */
export interface PopupState {
  open: boolean;
}

/**
 * One highlight for the whole list that glides to the option under the pointer, on the press
 * spring: the eye follows where the highlight went instead of finding it again. Arrow keys move it
 * at once, never a glide: keyboard navigation repeats too often to wait for motion. It appears in
 * place when the list opens or the pointer comes back. Only its transform moves; its height is set
 * outright, so no frame lays the list out again. `itemSlot` is the `data-slot` of the list's
 * options, such as `select-item`.
 */
function useGlidingHighlight(
  popup: RefObject<HTMLDivElement | null>,
  open: boolean,
  itemSlot: string,
) {
  const highlight = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const list = popup.current;
    const mark = highlight.current;
    if (!open || list === null || mark === null) return;
    let shown = false;
    let fromKeyboard = false;
    let glide: Controls | null = null;
    let hiding = 0;

    const follow = () => {
      const item = list.querySelector<HTMLElement>(`[data-slot="${itemSlot}"][data-highlighted]`);
      const tokens = readMotionTokens(list);
      // Where the highlight is now, mid glide if the pointer moved on quickly: read before
      // stopping it, so the next glide starts from there instead of hopping to the last target.
      const from = getComputedStyle(mark).transform;
      glide?.stop();
      cancelAnimationFrame(hiding);
      if (item === null || tokens === null) {
        // The pointer crossing from one option to the next clears the highlight a moment before
        // the next option takes it: hide only if nothing is highlighted a frame later, so the
        // highlight glides across instead of reappearing.
        hiding = requestAnimationFrame(() => {
          mark.style.opacity = '0';
          shown = false;
        });
        return;
      }
      const to = `translateY(${String(item.offsetTop)}px)`;
      Object.assign(mark.style, {
        transform: to,
        height: `${String(item.offsetHeight)}px`,
        opacity: '1',
      });
      if (shown && !fromKeyboard) {
        glide = springTo(mark, { transform: [from, to] }, tokens.spring.press);
      }
      shown = true;
    };

    // Captured on the document: the key reaches the list before Base UI moves the highlight.
    const onKey = () => {
      fromKeyboard = true;
    };
    const onPointer = () => {
      fromKeyboard = false;
    };
    follow();
    const observer = new MutationObserver(follow);
    observer.observe(list, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-highlighted'],
    });
    document.addEventListener('keydown', onKey, true);
    list.addEventListener('pointermove', onPointer);
    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', onKey, true);
      list.removeEventListener('pointermove', onPointer);
      glide?.stop();
      cancelAnimationFrame(hiding);
      mark.style.opacity = '0';
    };
  }, [popup, open, itemSlot]);

  return highlight;
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

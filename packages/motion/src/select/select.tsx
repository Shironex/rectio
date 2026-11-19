import {
  SelectContent as PlainSelectContent,
  SelectItem as PlainSelectItem,
  cn,
  type SelectContentProps,
  type SelectItemProps,
} from '@rectio/ui';
import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react';

import { springTo, tweenTo, type Controls } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export type { SelectContentProps, SelectItemProps };

type PopupState = Parameters<
  Extract<SelectContentProps['render'], (...args: never[]) => unknown>
>[1];

/**
 * One highlight for the whole list that glides to the option under the pointer, on the press
 * spring: the eye follows where the highlight went instead of finding it again. Arrow keys move it
 * at once, never a glide: keyboard navigation repeats too often to wait for motion. It appears in
 * place when the list opens or the pointer comes back. Only its transform moves; its height is set
 * outright, so no frame lays the list out again.
 */
function useGlidingHighlight(popup: RefObject<HTMLDivElement | null>, open: boolean) {
  const highlight = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const list = popup.current;
    const mark = highlight.current;
    if (!open || list === null || mark === null) return;
    let shown = false;
    let fromKeyboard = false;
    let glide: Controls | null = null;

    const follow = () => {
      const item = list.querySelector<HTMLElement>('[data-slot="select-item"][data-highlighted]');
      const tokens = readMotionTokens(list);
      // Where the highlight is now, mid glide if the pointer moved on quickly: read before
      // stopping it, so the next glide starts from there instead of hopping to the last target.
      const from = getComputedStyle(mark).transform;
      glide?.stop();
      if (item === null || tokens === null) {
        mark.style.opacity = '0';
        shown = false;
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
      mark.style.opacity = '0';
    };
  }, [popup, open]);

  return highlight;
}

function MotionPopup({
  state,
  ref,
  children,
  ...props
}: ComponentProps<'div'> & { state: PopupState; children?: ReactNode }) {
  const node = useRef<HTMLDivElement | null>(null);
  const running = useRef<Controls[]>([]);
  const highlight = useGlidingHighlight(node, state.open);

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

const REPLACES_CSS_MOTION = cn(
  'relative transition-none',
  'data-starting-style:translate-y-0 data-starting-style:scale-100 data-starting-style:opacity-100',
);

/**
 * SelectContent with a spring entrance from its trigger (Base UI's `--transform-origin`), a fast
 * fade on close and a highlight that glides under the pointer. Same props as the plain one.
 */
export function SelectContent({ className, ...props }: SelectContentProps) {
  const plain = usePlainMotion();
  if (plain)
    return <PlainSelectContent {...props} {...(className === undefined ? {} : { className })} />;
  return (
    <PlainSelectContent
      {...props}
      data-motion=""
      className={cn(REPLACES_CSS_MOTION, className)}
      render={(popupProps, state) => <MotionPopup {...popupProps} state={state} />}
    />
  );
}

/**
 * SelectItem that lets the list's gliding highlight show through. Use it with the motioned
 * SelectContent; under reduced motion it is the plain item with its own highlight.
 */
export function SelectItem({ className, ...props }: SelectItemProps) {
  const plain = usePlainMotion();
  if (plain)
    return <PlainSelectItem {...props} {...(className === undefined ? {} : { className })} />;
  return (
    <PlainSelectItem
      {...props}
      className={cn('relative data-highlighted:bg-transparent', className)}
    />
  );
}

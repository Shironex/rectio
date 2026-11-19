import type { Dialog as BaseDialog } from '@base-ui/react/dialog';
import {
  Dialog as PlainDialog,
  DialogContent as PlainDialogContent,
  DialogTrigger as PlainDialogTrigger,
  cn,
  type DialogContentProps,
} from '@rectio/ui';
import {
  createContext,
  use,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type RefObject,
} from 'react';

import { springTo, tweenTo, type Controls } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens, type MotionTokens } from '../lib/tokens';

export type { DialogContentProps };

/** The element that opened the dialog, so the popup can travel from it and back to it. */
const OriginContext = createContext<RefObject<HTMLElement | null> | null>(null);

type TriggerProps = ComponentProps<typeof PlainDialogTrigger>;
type TriggerPointer = Parameters<NonNullable<TriggerProps['onPointerDown']>>[0];

/** Same as the plain Dialog root, plus the trigger's position for the motioned popup. */
export function Dialog<Payload>(props: BaseDialog.Root.Props<Payload>) {
  const origin = useRef<HTMLElement | null>(null);
  return (
    <OriginContext value={origin}>
      <PlainDialog {...props} />
    </OriginContext>
  );
}

/**
 * Same as the plain trigger; remembers itself as the place the popup grows from. Recorded on mount
 * and again on pointer down, never on click: Base UI opens the popup synchronously inside its own
 * click handler, before a click listener here would run.
 */
export function DialogTrigger({ ref, onPointerDown, ...props }: TriggerProps) {
  const originRef = use(OriginContext);
  return (
    <PlainDialogTrigger
      {...props}
      ref={(node: HTMLElement | null) => {
        if (node !== null && originRef !== null) originRef.current = node;
        assignRef(ref, node);
      }}
      onPointerDown={(event: TriggerPointer) => {
        if (originRef !== null) originRef.current = event.currentTarget;
        onPointerDown?.(event);
      }}
    />
  );
}

/**
 * Where the popup starts and ends: grown from its edge nearest the trigger (the transform origin is
 * the trigger's centre, clamped into the popup), leaning a short way toward it and slightly
 * smaller. Never a flight across the page: the dialog stays where it will be read, and the eye
 * still connects it to the button. Without a visible trigger (opened from code or a shortcut), the
 * plain entrance: a short rise from the centre.
 */
function origin(popup: HTMLElement, trigger: HTMLElement | null, tokens: MotionTokens) {
  const box = trigger?.getBoundingClientRect();
  if (box === undefined || box.width === 0) {
    return {
      transformOrigin: '50% 50%',
      away: `translateY(${tokens.distance.shift}) scale(${String(tokens.scale.from)})`,
    };
  }
  const self = popup.getBoundingClientRect();
  const clamp = (value: number, size: number) => Math.min(Math.max(value, 0), size);
  const ox = clamp(box.left + box.width / 2 - self.left, self.width);
  const oy = clamp(box.top + box.height / 2 - self.top, self.height);
  const dx = box.left + box.width / 2 - (self.left + self.width / 2);
  const dy = box.top + box.height / 2 - (self.top + self.height / 2);
  const length = Math.hypot(dx, dy);
  // A unit vector toward the trigger, scaled by the token in CSS so rem and reduced motion apply.
  const [ux, uy] = length < 1 ? [0, 0] : [dx / length, dy / length];
  const lean = (unit: number) => `calc(${tokens.distance.origin} * ${unit.toFixed(3)})`;
  return {
    transformOrigin: `${ox.toFixed(1)}px ${oy.toFixed(1)}px`,
    away: `translate(${lean(ux)}, ${lean(uy)}) scale(${String(tokens.scale.origin)})`,
  };
}

type PopupState = Parameters<
  Extract<DialogContentProps['render'], (...args: never[]) => unknown>
>[1];

function MotionPopup({ state, ref, ...props }: ComponentProps<'div'> & { state: PopupState }) {
  const node = useRef<HTMLDivElement | null>(null);
  const originRef = use(OriginContext);
  const running = useRef<Controls[]>([]);

  useLayoutEffect(() => {
    const element = node.current;
    if (element === null) return;
    const tokens = readMotionTokens(element);
    if (tokens === null) return;
    // Read where it is now (mid flight if interrupted) before stopping what moves it.
    const now = getComputedStyle(element);
    const from = { transform: now.transform, opacity: now.opacity };
    // Measured only once nothing moves it: a popup caught mid flight would measure as its own
    // origin. Motion's stop() keeps the current frame, so the animations are cancelled outright.
    for (const controls of running.current) controls.stop();
    for (const animation of element.getAnimations()) animation.cancel();
    element.style.removeProperty('transform');
    element.style.removeProperty('opacity');
    const { transformOrigin, away } = origin(element, originRef?.current ?? null, tokens);
    element.style.transformOrigin = transformOrigin;
    running.current = state.open
      ? [
          // Opens: leans out of the trigger's side on the overlay spring, opaque early.
          springTo(element, { transform: [away, 'none'] }, tokens.spring.overlay),
          tweenTo(element, { opacity: [0, 1] }, tokens.duration.base, tokens.easing.enter),
        ]
      : [
          // Closes: leans back toward the trigger on the same spring, gone within the fast duration.
          springTo(element, { transform: [from.transform, away] }, tokens.spring.overlay),
          tweenTo(
            element,
            { opacity: [from.opacity, 0] },
            tokens.duration.fast,
            tokens.easing.exit,
          ),
        ];
  }, [state.open, originRef]);

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
const REPLACES_CSS_MOTION = cn(
  'transition-none',
  'data-starting-style:translate-y-0 data-starting-style:scale-100 data-starting-style:opacity-100',
);

/**
 * DialogContent that springs out of its trigger and back. Same props as the plain one; under
 * reduced motion it is the plain one (a fade in place).
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

import {
  ButtonSpinner,
  Button as PlainButton,
  cn,
  splitLeadingIcon,
  type ButtonProps,
} from '@rectio/ui';
import { useCallback, useRef, useState, type ReactNode, type Ref } from 'react';

import { springTo, type Controls } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export type { ButtonProps };

/** Keys that press a native button. */
const PRESS_KEYS = new Set([' ', 'Enter']);

/**
 * The arriving part starts a third of the way into the leaving one, which fades on a fast-out
 * curve: the leaving part is already faint and moving away, so the two cross instead of stacking,
 * and the slot is never drawn empty.
 */
const AFTER_EXIT = { transitionDelay: 'calc(var(--rx-motion-duration-fast) * 0.33)' };

/** Rises into place on the enter curve; drops away on the exit curve when the work is done. */
const ARRIVE = cn(
  'transition-[opacity,translate] duration-fast ease-exit',
  'translate-y-(--rx-motion-distance-shift) opacity-0',
  'in-data-loading:translate-y-0 in-data-loading:opacity-100',
  'in-data-loading:duration-base in-data-loading:ease-enter',
  // Starts hidden on the first frame, so the arrival is a transition too.
  'starting:in-data-loading:translate-y-(--rx-motion-distance-shift) starting:in-data-loading:opacity-0',
);

/**
 * The label stays put and readable the whole time. A leading icon leaves upward and the spinner
 * arrives from below in its slot, so the width never changes; a text-only button gains the spinner
 * before its label. CSS transitions on the button's `data-loading`: no script runs per frame.
 */
function MorphContent({
  children,
  loading,
  iconOnly,
}: {
  children: ReactNode;
  loading: boolean;
  iconOnly: boolean;
}) {
  const [indicator, setIndicator] = useState(loading);
  // Mount the spinner as loading starts; unmount it once it has faded out, so idle buttons never
  // keep an invisible animation running.
  if (loading && !indicator) setIndicator(true);
  const { icon, label } = splitLeadingIcon(children, iconOnly);

  const spinner = (slot: boolean) =>
    indicator && (
      <span
        data-part="indicator"
        aria-hidden
        style={loading && slot ? AFTER_EXIT : undefined}
        onTransitionEnd={(event) => {
          if (!loading && event.target === event.currentTarget) setIndicator(false);
        }}
        className={cn(
          'inline-flex items-center justify-center',
          slot && 'absolute inset-0',
          ARRIVE,
        )}
      >
        <ButtonSpinner />
      </span>
    );

  if (icon === null) {
    return (
      <>
        {spinner(false)}
        {children}
      </>
    );
  }
  return (
    <>
      <span data-part="icon-slot" className="relative inline-flex items-center justify-center">
        <span
          data-part="icon"
          style={loading ? undefined : AFTER_EXIT}
          className={cn(
            'inline-flex transition-[opacity,translate] duration-base ease-enter',
            'in-data-loading:-translate-y-(--rx-motion-distance-shift) in-data-loading:opacity-0',
            // Leaves on the exit easing: mostly gone early instead of holding, then vanishing.
            'in-data-loading:duration-fast in-data-loading:ease-exit',
          )}
        >
          {icon}
        </span>
        {spinner(true)}
      </span>
      {label}
    </>
  );
}

function MotionButton({
  ref,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  className,
  ...props
}: ButtonProps) {
  const node = useRef<HTMLButtonElement | null>(null);
  const running = useRef<Controls | null>(null);
  const pressed = useRef(false);

  const setRef = useCallback(
    (value: HTMLButtonElement | null) => {
      node.current = value;
      assignRef(ref as Ref<HTMLButtonElement> | undefined, value);
    },
    [ref],
  );

  const inert = props.disabled === true || props.loading === true;

  /** Press in on a spring and release on the same spring, so a quick tap still reads. */
  const press = (down: boolean) => {
    const element = node.current;
    if (element === null || pressed.current === down || (down && inert)) return;
    pressed.current = down;
    const tokens = readMotionTokens(element);
    if (tokens === null) return;
    running.current?.stop();
    running.current = springTo(
      element,
      { transform: `scale(${String(down ? tokens.scale.press : 1)})` },
      tokens.spring.press,
    );
  };

  return (
    <PlainButton
      ref={setRef}
      data-motion=""
      // The spring replaces the CSS press scale; this keeps the two from stacking.
      className={cn('active:scale-100', className)}
      renderContent={(content) => <MorphContent {...content} />}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.button === 0) press(true);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        press(false);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        press(false);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        press(false);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (PRESS_KEYS.has(event.key) && !event.repeat) press(true);
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        if (PRESS_KEYS.has(event.key)) press(false);
      }}
      {...props}
    />
  );
}

/**
 * Button with a spring press and a loading morph. Same props as the plain Button; under reduced
 * motion it is the plain Button.
 */
export function Button(props: ButtonProps) {
  const plain = usePlainMotion();
  return plain ? <PlainButton {...props} /> : <MotionButton {...props} />;
}

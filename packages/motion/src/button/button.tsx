import { CircleNotchIcon } from '@phosphor-icons/react';
import { Button as PlainButton, cn, type ButtonProps } from '@rectio/ui';
import { useCallback, useRef, useState, type ReactNode, type Ref } from 'react';

import { springTo, type Controls } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export type { ButtonProps };

/** Keys that press a native button. */
const PRESS_KEYS = new Set([' ', 'Enter']);

/**
 * The arriving part starts three quarters through the leaving one, which fades on a fast-out
 * curve: by then it is nearly gone, so the two never read on top of each other, and the slot is
 * never empty for more than a frame.
 */
const AFTER_EXIT = { transitionDelay: 'calc(var(--rx-motion-duration-fast) * 0.75)' };

/**
 * The label leaves upward and the spinner arrives from below, then the reverse when the work is
 * done. CSS transitions on the button's `data-loading`: no script runs per frame. The label stays
 * in the layout and in the accessibility tree, so the width never changes and the name is kept.
 */
function MorphContent({ children, loading }: { children: ReactNode; loading: boolean }) {
  const [indicator, setIndicator] = useState(loading);
  // Mount the spinner as loading starts; unmount it once it has faded out, so idle buttons never
  // keep an invisible animation running.
  if (loading && !indicator) setIndicator(true);
  return (
    <>
      <span
        data-part="label"
        style={loading ? { gap: 'inherit' } : { gap: 'inherit', ...AFTER_EXIT }}
        className={cn(
          'inline-flex items-center',
          'transition-[opacity,translate] duration-base ease-enter',
          'in-data-loading:-translate-y-(--rx-motion-distance-shift) in-data-loading:opacity-0',
          // Fast out, not ease-in: the label is mostly gone early instead of holding then vanishing.
          'in-data-loading:duration-fast in-data-loading:ease-standard',
        )}
      >
        {children}
      </span>
      {indicator && (
        <span
          data-part="indicator"
          aria-hidden
          style={loading ? AFTER_EXIT : undefined}
          onTransitionEnd={(event) => {
            if (!loading && event.target === event.currentTarget) setIndicator(false);
          }}
          className={cn(
            'absolute inset-0 inline-flex items-center justify-center',
            'translate-y-(--rx-motion-distance-shift) opacity-0',
            'transition-[opacity,translate] duration-fast ease-exit',
            'in-data-loading:translate-y-0 in-data-loading:opacity-100',
            'in-data-loading:duration-base in-data-loading:ease-enter',
            // Starts hidden on the first frame, so the arrival is a transition too.
            'starting:in-data-loading:translate-y-(--rx-motion-distance-shift) starting:in-data-loading:opacity-0',
          )}
        >
          <CircleNotchIcon aria-hidden className="size-4 animate-spin" weight="bold" />
        </span>
      )}
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

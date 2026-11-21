import { ToggleGroup as PlainToggleGroup, cn, type ToggleGroupProps } from '@rectio/ui';
import { useLayoutEffect, useRef, type RefObject } from 'react';

import { springTo, type Controls } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export type { ToggleGroupProps };

/**
 * One raised chip for the whole group that slides to the pressed segment on the press spring, so
 * the eye follows the choice instead of finding it again. It is placed without a slide when the
 * group first draws or resizes, and turns around mid slide when a second press comes quickly.
 */
function useGlidingIndicator(group: RefObject<HTMLDivElement | null>) {
  const indicator = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const root = group.current;
    const mark = indicator.current;
    if (root === null || mark === null) return;
    let shown = false;
    let glide: Controls | null = null;

    const place = (slide: boolean) => {
      const item = root.querySelector<HTMLElement>(':scope > [data-slot="toggle"][data-pressed]');
      // Where the chip is now, mid slide if a press came quickly: read before stopping the glide.
      const now = getComputedStyle(mark);
      const from = { transform: now.transform, width: now.width };
      glide?.stop();
      glide = null;
      if (item === null) {
        mark.style.opacity = '0';
        shown = false;
        return;
      }
      const to = {
        transform: `translateX(${String(item.offsetLeft)}px)`,
        width: `${String(item.offsetWidth)}px`,
      };
      Object.assign(mark.style, to, { opacity: '1' });
      const tokens = readMotionTokens(mark);
      if (slide && shown && tokens !== null) {
        glide = springTo(
          mark,
          { transform: [from.transform, to.transform], width: [from.width, to.width] },
          tokens.spring.press,
        );
      }
      shown = true;
    };

    place(false);
    const pressed = new MutationObserver(() => {
      place(true);
    });
    pressed.observe(root, { subtree: true, attributes: true, attributeFilter: ['data-pressed'] });
    const resized =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            place(false);
          })
        : null;
    resized?.observe(root);
    return () => {
      pressed.disconnect();
      resized?.disconnect();
      glide?.stop();
    };
  }, [group]);

  return indicator;
}

function MotionToggleGroup({ ref, className, children, ...props }: ToggleGroupProps) {
  const group = useRef<HTMLDivElement | null>(null);
  const indicator = useGlidingIndicator(group);
  return (
    <PlainToggleGroup
      ref={(node: HTMLDivElement | null) => {
        group.current = node;
        assignRef(ref, node);
      }}
      data-motion=""
      // Hands the pressed segment's chip to the indicator, so the two never draw at once.
      data-glide=""
      className={cn('relative', className)}
      {...props}
    >
      <span
        ref={indicator}
        aria-hidden
        data-part="indicator"
        className="pointer-events-none absolute inset-y-0.5 left-0 rounded-(--rx-button-radius) bg-surface-overlay opacity-0 shadow-raised ring-1 ring-line-strong"
      />
      {children}
    </PlainToggleGroup>
  );
}

/**
 * ToggleGroup whose chosen segment slides to the new choice. Same props as the plain one. Only a
 * single-select group glides; with `multiple` several segments can be pressed at once, so it is
 * the plain group.
 */
export function ToggleGroup(props: ToggleGroupProps) {
  const plain = usePlainMotion();
  return plain || props.multiple === true ? (
    <PlainToggleGroup {...props} />
  ) : (
    <MotionToggleGroup {...props} />
  );
}

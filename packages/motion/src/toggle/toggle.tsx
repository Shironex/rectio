import {
  SegmentedControl as PlainSegmentedControl,
  ToggleGroup as PlainToggleGroup,
  cn,
  type SegmentedControlProps,
  type ToggleGroupProps,
} from '@rectio/ui';
import { useLayoutEffect, useRef, type Ref, type RefObject } from 'react';

import { springTo, type Controls } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export type { SegmentedControlProps, ToggleGroupProps };

/** The chip drawn for the whole group: the same raised surface and edge as a pressed segment. */
const INDICATOR = cn(
  'pointer-events-none absolute top-0 left-0 rounded-(--rx-button-radius) opacity-0',
  'bg-surface-overlay shadow-raised ring-1 ring-line-strong',
);

/**
 * One raised chip for the whole group that slides to the pressed segment on the press spring, so
 * the eye follows the choice instead of finding it again. It moves on both axes, so a segmented
 * control laid out in two columns on a phone glides between rows too. It is placed without a
 * slide when the group first draws or resizes, and turns around mid slide when a second press
 * comes quickly. The chip is added to the group here, so the group's own children stay its
 * toggles.
 */
function useGlidingIndicator(group: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const root = group.current;
    if (root === null) return;
    const mark = document.createElement('span');
    mark.setAttribute('aria-hidden', 'true');
    mark.dataset.part = 'indicator';
    mark.className = INDICATOR;
    root.prepend(mark);
    let shown = false;
    let glide: Controls | null = null;

    const place = (slide: boolean) => {
      const item = root.querySelector<HTMLElement>(':scope > [data-slot="toggle"][data-pressed]');
      // Where the chip is now, mid slide if a press came quickly: read before stopping the glide.
      const now = getComputedStyle(mark);
      const from = { transform: now.transform, width: now.width, height: now.height };
      glide?.stop();
      glide = null;
      if (item === null) {
        mark.style.opacity = '0';
        shown = false;
        return;
      }
      const to = {
        transform: `translate(${String(item.offsetLeft)}px, ${String(item.offsetTop)}px)`,
        width: `${String(item.offsetWidth)}px`,
        height: `${String(item.offsetHeight)}px`,
      };
      Object.assign(mark.style, to, { opacity: '1' });
      const tokens = readMotionTokens(mark);
      if (slide && shown && tokens !== null) {
        glide = springTo(
          mark,
          {
            transform: [from.transform, to.transform],
            width: [from.width, to.width],
            height: [from.height, to.height],
          },
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
      mark.remove();
    };
  }, [group]);
}

/** A ref for the group that also starts the gliding indicator in it. */
function useGlidingGroup(ref: Ref<HTMLDivElement> | undefined) {
  const group = useRef<HTMLDivElement | null>(null);
  useGlidingIndicator(group);
  return (node: HTMLDivElement | null) => {
    group.current = node;
    assignRef(ref, node);
  };
}

/** Marks the group as motioned and hands the pressed segment's chip to the indicator. */
const GLIDE = { 'data-motion': '', 'data-glide': '' };

function MotionToggleGroup({ ref, className, ...props }: ToggleGroupProps) {
  const groupRef = useGlidingGroup(ref);
  return (
    <PlainToggleGroup ref={groupRef} {...GLIDE} className={cn('relative', className)} {...props} />
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

function MotionSegmentedControl<Value extends string>({
  ref,
  className,
  ...props
}: SegmentedControlProps<Value>) {
  const groupRef = useGlidingGroup(ref);
  return (
    <PlainSegmentedControl<Value>
      ref={groupRef}
      {...GLIDE}
      className={cn('relative', className)}
      {...props}
    />
  );
}

/**
 * SegmentedControl whose chosen option slides to the new choice, across rows as well when it sits
 * in two columns. Same props as the plain one; under reduced motion it is the plain one.
 */
export function SegmentedControl<Value extends string = string>(
  props: SegmentedControlProps<Value>,
) {
  const plain = usePlainMotion();
  return plain ? (
    <PlainSegmentedControl<Value> {...props} />
  ) : (
    <MotionSegmentedControl<Value> {...props} />
  );
}

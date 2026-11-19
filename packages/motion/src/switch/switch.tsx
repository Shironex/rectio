import {
  Switch as PlainSwitch,
  SwitchField as PlainSwitchField,
  cn,
  type SwitchFieldProps,
  type SwitchProps,
} from '@rectio/ui';
import { useLayoutEffect, useRef, type RefObject } from 'react';

import { springTo, type Controls } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export type { SwitchFieldProps, SwitchProps };

/** `none` reads as no offset, so the spring has two lengths to run between. */
const length = (value: string) => (value === 'none' || value === '' ? '0px' : value);

/**
 * The thumb runs to its new end on the press spring and settles, so a flip reads as the thumb
 * travelling rather than jumping. A quick second press turns it around from wherever it is. The
 * end position still comes from the plain switch's CSS; the spring only fills the way there.
 */
function useThumbSpring(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const element = root.current;
    const thumb = element?.querySelector<HTMLElement>('[data-slot="switch-thumb"]');
    if (element == null || thumb == null) return;
    let settled = length(getComputedStyle(thumb).translate);
    let running: Controls | null = null;

    const observer = new MutationObserver(() => {
      // Mid run, start from where the thumb is now; at rest, from where it last settled.
      const from = running === null ? settled : length(getComputedStyle(thumb).translate);
      running?.stop();
      running = null;
      thumb.style.translate = '';
      const to = length(getComputedStyle(thumb).translate);
      settled = to;
      const tokens = readMotionTokens(thumb);
      if (tokens === null || from === to) return;
      const spring = springTo(thumb, { translate: [from, to] }, tokens.spring.press);
      running = spring;
      const done = () => {
        if (running === spring) running = null;
      };
      void Promise.resolve(spring.finished).then(done, done);
    });
    observer.observe(element, { attributes: true, attributeFilter: ['data-checked'] });
    return () => {
      observer.disconnect();
      running?.stop();
    };
  }, [root]);
}

/** The spring moves the thumb, so the plain CSS transition keeps only the colour. */
const THUMB = 'transition-[background-color]';

function MotionSwitch({ ref, thumbClassName, ...props }: SwitchProps) {
  const root = useRef<HTMLElement | null>(null);
  useThumbSpring(root);
  return (
    <PlainSwitch
      ref={(node: HTMLElement | null) => {
        root.current = node;
        assignRef(ref, node);
      }}
      data-motion=""
      thumbClassName={cn(THUMB, thumbClassName)}
      {...props}
    />
  );
}

/** Switch whose thumb travels on a spring. Same props as the plain one. */
export function Switch(props: SwitchProps) {
  const plain = usePlainMotion();
  return plain ? <PlainSwitch {...props} /> : <MotionSwitch {...props} />;
}

function MotionSwitchField({ ref, thumbClassName, ...props }: SwitchFieldProps) {
  const root = useRef<HTMLElement | null>(null);
  useThumbSpring(root);
  return (
    <PlainSwitchField
      ref={(node: HTMLElement | null) => {
        root.current = node;
        assignRef(ref, node);
      }}
      data-motion=""
      thumbClassName={cn(THUMB, thumbClassName)}
      {...props}
    />
  );
}

/** SwitchField whose thumb travels on a spring. Same props as the plain one. */
export function SwitchField(props: SwitchFieldProps) {
  const plain = usePlainMotion();
  return plain ? <PlainSwitchField {...props} /> : <MotionSwitchField {...props} />;
}

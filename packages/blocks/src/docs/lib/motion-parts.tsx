import { Button, usePlainMotion } from '@rectio/motion';
import { TabsList } from '@rectio/motion/navigation';
import { cn } from '@rectio/ui';
import { useLayoutEffect, useRef, type ComponentType, type ReactNode, type RefObject } from 'react';

import {
  DocsPartsProvider,
  markerStyle,
  type DocsParts,
  type MarkerProps,
  type RevealProps,
  type SwapProps,
} from './parts';

/**
 * The motion variant's parts. Every animation moves only transform and opacity, enters on the
 * `enter` easing, and reduced motion, `MotionPreferenceProvider value="off"` or a browser without
 * Web Animations renders the plain parts. Durations, distances and easings are read from the theme
 * at the moment an animation starts.
 */

function token(element: Element, name: string): string {
  return getComputedStyle(element).getPropertyValue(`--rx-motion-${name}`).trim();
}

/** A duration token in milliseconds; null when the token stylesheet is missing. */
function ms(element: Element, name: string): number | null {
  const match = /^([\d.]+)(ms|s)$/.exec(token(element, `duration-${name}`));
  if (match === null) return null;
  const amount = Number(match[1]);
  return match[2] === 's' ? amount * 1000 : amount;
}

/** Calls `onEnter` once, the first time the element is at least partly on screen. */
function useFirstView(
  ref: RefObject<HTMLElement | null>,
  onEnter: (element: HTMLElement) => () => void,
) {
  const plain = usePlainMotion();
  useLayoutEffect(() => {
    const element = ref.current;
    if (plain || element === null || typeof IntersectionObserver === 'undefined') return;
    let cleanup: (() => void) | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        cleanup = onEnter(element);
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cleanup?.();
    };
    // Runs once per mount: the entrance belongs to the first view only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plain]);
  return plain;
}

/** Steps between staggered items, as multiples of the stagger token: quick first, then settling. */
const STAGGER_STEPS = [0, 1, 1.8, 2.5, 3.1, 3.6, 4, 4.3];

function Reveal({ children, className, stagger = false, as: Tag = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const plain = useFirstView(ref, (element) => {
    delete element.dataset.enter;
    const duration = ms(element, 'reveal');
    const step = ms(element, 'stagger');
    const distance = token(element, 'distance-reveal');
    if (duration === null || step === null || distance === '') return () => undefined;
    const easing = token(element, 'easing-enter') || 'linear';
    const targets = stagger ? [...element.children] : [element];
    const animations = targets.map((target, index) =>
      target.animate(
        [
          { opacity: 0, transform: `translateY(${distance})` },
          { opacity: 1, transform: 'none' },
        ],
        {
          duration,
          easing,
          delay: (STAGGER_STEPS[Math.min(index, STAGGER_STEPS.length - 1)] ?? 0) * step,
          fill: 'backwards',
        },
      ),
    );
    return () => {
      for (const animation of animations) animation.cancel();
    };
  });
  return (
    <Tag
      ref={ref}
      // Hidden until its first view starts the entrance; never set when motion is off.
      data-enter={plain ? undefined : 'waiting'}
      className={cn(
        stagger ? 'data-[enter=waiting]:*:opacity-0' : 'data-[enter=waiting]:opacity-0',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Glides between headings with a CSS transition on transform, so a fast scroll retargets it
 * mid-way instead of queueing animations.
 */
function Marker({ top, height, className }: MarkerProps) {
  const plain = usePlainMotion();
  return (
    <span
      aria-hidden
      className={cn(
        className,
        !plain && 'transition-transform duration-base ease-standard motion-reduce:transition-none',
      )}
      style={markerStyle(top, height)}
    />
  );
}

/** Fades the new state up a short way as it replaces the last one. */
function Swap({ swapKey, children, className }: SwapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const plain = usePlainMotion();
  const first = useRef(true);
  useLayoutEffect(() => {
    const element = ref.current;
    if (first.current) {
      first.current = false;
      return;
    }
    if (plain || element === null) return;
    const duration = ms(element, 'slow');
    const distance = token(element, 'distance-shift');
    if (duration === null) return;
    const animation = element.animate(
      [
        { opacity: 0, transform: `translateY(${distance || '0px'})` },
        { opacity: 1, transform: 'none' },
      ],
      { duration, easing: token(element, 'easing-enter') || 'linear' },
    );
    return () => {
      animation.cancel();
    };
  }, [swapKey, plain]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export const MOTION_DOCS_PARTS: DocsParts = { Button, TabsList, Reveal, Marker, Swap };

/** Renders its blocks with the motion parts. Each motion block wraps itself in it. */
export function DocsMotionParts({ children }: { children: ReactNode }) {
  return <DocsPartsProvider parts={MOTION_DOCS_PARTS}>{children}</DocsPartsProvider>;
}

/** The motion twin of a plain block: the same component under the motion parts. */
export function motioned<P extends object>(Plain: ComponentType<P>, name: string) {
  function Motioned(props: P) {
    return (
      <DocsMotionParts>
        <Plain {...props} />
      </DocsMotionParts>
    );
  }
  Motioned.displayName = name;
  return Motioned;
}

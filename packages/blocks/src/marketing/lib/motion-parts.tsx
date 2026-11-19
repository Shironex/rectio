import { Button, usePlainMotion } from '@rectio/motion';
import { cn } from '@rectio/ui';
import { useLayoutEffect, useRef, type ComponentType, type ReactNode, type RefObject } from 'react';

import {
  MarketingPartsProvider,
  type CountProps,
  type MarketingParts,
  type RevealProps,
  type SwapProps,
} from './parts';

/**
 * The motion variant's parts. Every animation moves only transform and opacity, enters on the
 * `enter` easing and plays once: a section already on screen never animates again when its content
 * changes. Reduced motion, `MotionPreferenceProvider value="off"` or a browser without Web
 * Animations renders the plain parts. Durations, distances and easings are read from the theme at
 * the moment an animation starts.
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
      // A little inside the viewport, so the entrance is seen rather than finished off screen.
      { rootMargin: '0px 0px -10% 0px' },
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

/**
 * Steps between staggered items, as multiples of the stagger token. Never a uniform beat: the
 * first items come quicker, the later ones settle in, and the whole set lands within a few steps.
 */
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
 * Counts from zero to the figure once, on first view, on the `settle` easing so it slows evenly into
 * the exact value. The final figure reserves its width and is what assistive technology reads.
 */
function Count({ value, format, className }: CountProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<HTMLSpanElement>(null);
  useFirstView(ref, (element) => {
    const target = shown.current;
    const duration = ms(element, 'count');
    if (target === null || duration === null) return () => undefined;
    const settle = /cubic-bezier\(([^)]*)\)/.exec(token(element, 'easing-settle'));
    const [, y1 = 1, , y2 = 1] = (settle?.[1] ?? '0.25, 1, 0.5, 1').split(',').map(Number);
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // A cubic easing from the token's control points, close enough for a figure that settles.
      const eased = 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3;
      target.textContent = format(t === 1 ? value : value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      target.textContent = format(value);
    };
  });
  return (
    <span ref={ref} className={cn('inline-grid', className)}>
      <span className="sr-only">{format(value)}</span>
      {/* The final figure, invisible, holds the width while the count runs over it. */}
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {format(value)}
      </span>
      <span ref={shown} aria-hidden className="col-start-1 row-start-1">
        {format(value)}
      </span>
    </span>
  );
}

/** Slides each new word up from under its baseline as it replaces the last one. */
function Swap({ swapKey, children, className }: SwapProps) {
  const ref = useRef<HTMLSpanElement>(null);
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
    if (duration === null) return;
    const animation = element.animate(
      [
        { opacity: 0, transform: 'translateY(60%)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration, easing: token(element, 'easing-enter') || 'linear' },
    );
    return () => {
      animation.cancel();
    };
  }, [swapKey, plain]);
  return (
    <span ref={ref} className={cn('inline-block', className)}>
      {children}
    </span>
  );
}

export const MOTION_MARKETING_PARTS: MarketingParts = { Button, Reveal, Count, Swap };

/** Renders its blocks with the motion parts. Each motion block wraps itself in it. */
export function MarketingMotionParts({ children }: { children: ReactNode }) {
  return <MarketingPartsProvider parts={MOTION_MARKETING_PARTS}>{children}</MarketingPartsProvider>;
}

/**
 * The motion twin of a plain block: the same component under the motion parts. Each block's
 * `.motion.tsx` file is a line of these.
 */
export function motioned<P extends object>(Plain: ComponentType<P>, name: string) {
  function Motioned(props: P) {
    return (
      <MarketingMotionParts>
        <Plain {...props} />
      </MarketingMotionParts>
    );
  }
  Motioned.displayName = name;
  return Motioned;
}

import {
  Button,
  Money,
  TableRow,
  TableRows,
  readMotionTokens,
  usePlainMotion,
  type MotionTokens,
} from '@rectio/motion';
import { cn } from '@rectio/ui';
import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';

import { BlockPartsProvider, type BlockParts } from './block-parts';

/**
 * The motion variant's parts. Every animation here moves only transform and opacity, enters on the
 * `enter` easing and leaves faster than it came, and plays once: a block that is already on screen
 * never animates again when its data changes. Reduced motion, `MotionPreferenceProvider value="off"`
 * or a browser without Web Animations renders the plain parts.
 */

/** A motion easing token as Web Animations takes it: the custom property's own value. */
function easing(element: Element, name: keyof MotionTokens['easing']): string {
  return (
    getComputedStyle(element).getPropertyValue(`--rx-motion-easing-${name}`).trim() || 'linear'
  );
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

/** Fades the block's body up by the token shift, once, on first view. */
function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const plain = useFirstView(ref, (element) => {
    const tokens = readMotionTokens(element);
    delete element.dataset.enter;
    if (tokens === null) return () => undefined;
    const animation = element.animate(
      [
        { opacity: 0, transform: `translateY(${tokens.distance.shift})` },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: tokens.duration.slow * 1000,
        easing: easing(element, 'enter'),
        fill: 'backwards',
      },
    );
    return () => {
      animation.cancel();
    };
  });
  return (
    <div
      ref={ref}
      // Hidden until its first view starts the entrance; never set when motion is off.
      data-enter={plain ? undefined : 'waiting'}
      className={cn('data-[enter=waiting]:opacity-0', className)}
    >
      {children}
    </div>
  );
}

const BAR = '.recharts-bar-rectangle path, .recharts-bar-rectangle rect';
// Recharts 3 draws a line's dots in their own layer, outside `.recharts-line`.
const LINE = '.recharts-line, .recharts-line-dots, .recharts-area';
/** Bars arrive one after another, but the whole set lands within this many steps of the first. */
const STAGGER_STEPS = 8;

/**
 * Grows each bar from the zero line (scaleY for columns, scaleX for horizontal bars) and fades the
 * lines in after the bars, or draws a chart of lines alone from left to right, once, on first view. Values are never animated: the bars reach their
 * true length and the figures beside them are exact from the first frame.
 */
function ChartStage({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const plain = useFirstView(ref, (element) => {
    const tokens = readMotionTokens(element);
    const animations: Animation[] = [];
    let frame = 0;
    let tries = 0;
    const start = () => {
      const bars = [...element.querySelectorAll<SVGGraphicsElement>(BAR)];
      const lines = [...element.querySelectorAll<SVGGraphicsElement>(LINE)];
      // A responsive chart draws after it has measured itself: wait a few frames for the marks.
      if (bars.length === 0 && lines.length === 0 && tries < 30) {
        tries += 1;
        frame = requestAnimationFrame(start);
        return;
      }
      delete element.dataset.enter;
      if (tokens === null) return;
      const ease = easing(element, 'enter');
      const duration = tokens.duration.slow * 1000;
      const step = (tokens.duration.base * 1000) / STAGGER_STEPS / 2;
      const horizontal = element.querySelector('[data-bars="horizontal"]') !== null;
      const zero = element.querySelector<SVGGraphicsElement>('.rx-zero line');
      const zeroBox = zero?.getBBox();
      bars.forEach((bar, index) => {
        const box = bar.getBBox();
        const below =
          zeroBox !== undefined && !horizontal && box.y >= zeroBox.y - 0.5 && box.height > 0;
        // Not animatable themselves: set on the bar so the scale grows from the zero line.
        bar.style.transformBox = 'fill-box';
        bar.style.transformOrigin = horizontal
          ? 'left center'
          : below
            ? 'center top'
            : 'center bottom';
        animations.push(
          bar.animate(
            [{ transform: horizontal ? 'scaleX(0)' : 'scaleY(0)' }, { transform: 'none' }],
            {
              duration,
              easing: ease,
              delay: Math.min(index, STAGGER_STEPS) * step,
              fill: 'backwards',
            },
          ),
        );
      });
      for (const line of lines) {
        // A chart of lines alone draws them through time, left to right, with a clip: the marks
        // are at their true values from the first frame, only uncovered.
        if (bars.length === 0) {
          animations.push(
            line.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
              duration,
              easing: ease,
              fill: 'backwards',
            }),
          );
          continue;
        }
        animations.push(
          line.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: tokens.duration.base * 1000,
            easing: ease,
            delay: bars.length > 0 ? tokens.duration.base * 1000 : 0,
            fill: 'backwards',
          }),
        );
      }
    };
    start();
    return () => {
      cancelAnimationFrame(frame);
      for (const animation of animations) animation.cancel();
    };
  });
  return (
    <div
      ref={ref}
      data-enter={plain ? undefined : 'waiting'}
      className={cn(
        'data-[enter=waiting]:[&_.recharts-bar-rectangle]:opacity-0',
        'data-[enter=waiting]:[&_.recharts-line]:opacity-0',
        'data-[enter=waiting]:[&_.recharts-line-dots]:opacity-0',
        'data-[enter=waiting]:[&_.recharts-area]:opacity-0',
        className,
      )}
    >
      {children}
    </div>
  );
}

export const MOTION_PARTS: BlockParts = {
  Button,
  Money,
  Reveal,
  ChartStage,
  // Rows arrive and leave by transform and opacity only, the same as the motion table's rows.
  Rows: TableRows,
  Row: TableRow,
};

/** Renders its blocks with the motion parts. Each motion block wraps itself in it. */
export function MotionParts({ children }: { children: ReactNode }) {
  return <BlockPartsProvider parts={MOTION_PARTS}>{children}</BlockPartsProvider>;
}

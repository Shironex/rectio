import { cn } from '@rectio/ui';
import { ChartMotionProvider, type ChartMotion, type ChartStageProps } from '@rectio/ui/charts';
import { useMemo, useRef, useState, type ReactNode } from 'react';

import { cssEasing, useFirstView } from '../lib/first-view';
import { usePlainMotion } from '../lib/mode';
import { readMotionTokens, type Bezier } from '../lib/tokens';

/**
 * The motion parts of the charts. The entrance plays once, the first time a chart is seen: lines
 * and areas are uncovered from left to right along time, bars grow from the zero line one after
 * another, and a ring's parts settle in around it. Marks are at their true values from the first
 * frame, only uncovered, so a figure is never shown wrong mid-flight. After the entrance, a change
 * of data glides the marks to their new values. Everything runs on the Web Animations API and
 * Recharts' own transitions: no animation library. Reduced motion renders the plain charts.
 */

const LINES = '.recharts-line, .recharts-line-dots, .recharts-area';
const BARS = '.recharts-bar-rectangle path, .recharts-bar-rectangle rect';
const SECTORS = '.recharts-pie-sector';
/** Bars arrive one after another, but the whole set lands within this many steps of the first. */
const STAGGER_STEPS = 8;

/** Plays the entrance on a chart's plot; returns its cleanup. */
function enter(
  element: Element,
  { kind, horizontal = false }: Pick<ChartStageProps, 'kind' | 'horizontal'>,
  done: () => void,
) {
  const root = element as HTMLElement;
  const tokens = readMotionTokens(root);
  const animations: Animation[] = [];
  let frame = 0;
  let tries = 0;
  const start = () => {
    const marks = root.querySelectorAll(kind === 'donut' ? SECTORS : kind === 'bar' ? BARS : LINES);
    // A responsive chart draws after it has measured itself: wait a few frames for the marks.
    if (marks.length === 0 && tries < 30) {
      tries += 1;
      frame = requestAnimationFrame(start);
      return;
    }
    delete root.dataset.enter;
    if (tokens === null) {
      done();
      return;
    }
    const ease = cssEasing(root, 'enter');
    const step = (tokens.duration.base * 1000) / STAGGER_STEPS / 2;
    if (kind === 'line' || kind === 'area') {
      for (const mark of root.querySelectorAll<SVGGraphicsElement>(LINES)) {
        animations.push(
          mark.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
            duration: tokens.duration.count * 1000,
            easing: cssEasing(root, 'settle'),
            fill: 'backwards',
          }),
        );
      }
    } else if (kind === 'bar') {
      const zero = root.querySelector<SVGGraphicsElement>('.rx-zero line')?.getBBox();
      [...root.querySelectorAll<SVGGraphicsElement>(BARS)].forEach((bar, index) => {
        const box = bar.getBBox();
        // Bars on the negative side grow away from the zero line too.
        const below =
          zero !== undefined &&
          (horizontal
            ? box.x + box.width <= zero.x + 0.5 && box.width > 0
            : box.y >= zero.y - 0.5 && box.height > 0);
        // Not animatable themselves: set on the bar so the scale grows from the zero line.
        bar.style.transformBox = 'fill-box';
        bar.style.transformOrigin = horizontal
          ? below
            ? 'right center'
            : 'left center'
          : below
            ? 'center top'
            : 'center bottom';
        animations.push(
          bar.animate(
            [{ transform: horizontal ? 'scaleX(0)' : 'scaleY(0)' }, { transform: 'none' }],
            {
              duration: tokens.duration.slow * 1000,
              easing: ease,
              delay: Math.min(index, STAGGER_STEPS) * step,
              fill: 'backwards',
            },
          ),
        );
      });
    } else {
      [...root.querySelectorAll<SVGGraphicsElement>(SECTORS)].forEach((sector, index) => {
        sector.style.transformBox = 'view-box';
        sector.style.transformOrigin = 'center';
        animations.push(
          sector.animate(
            [
              { opacity: 0, transform: `scale(${String(tokens.scale.from)})` },
              { opacity: 1, transform: 'none' },
            ],
            {
              duration: tokens.duration.slow * 1000,
              easing: ease,
              delay: Math.min(index, STAGGER_STEPS) * step * 2,
              fill: 'backwards',
            },
          ),
        );
      });
    }
    const last = animations.at(-1);
    if (last === undefined) done();
    else
      void last.finished.then(done, () => {
        // Cancelled on unmount: nothing left to do.
      });
  };
  start();
  return () => {
    cancelAnimationFrame(frame);
    for (const animation of animations) animation.cancel();
  };
}

/** A cubic Bézier easing as a function of progress, for Recharts' transitions. */
export function bezier([x1, y1, x2, y2]: Bezier): (progress: number) => number {
  const at = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (progress) => {
    if (progress <= 0 || progress >= 1) return progress;
    // Bisection on x: fast enough for a few dozen frames, and never diverges.
    let low = 0;
    let high = 1;
    let t = progress;
    for (let i = 0; i < 20; i += 1) {
      t = (low + high) / 2;
      if (at(x1, x2, t) < progress) low = t;
      else high = t;
    }
    return at(y1, y2, t);
  };
}

/** Renders its charts with the motion parts. Each motion chart wraps itself in it. */
export function ChartMotionParts({ children }: { children: ReactNode }) {
  const plain = usePlainMotion();
  const [entered, setEntered] = useState(false);
  // The update timing, read from the tokens on the stage once it is in the page.
  const [timing, setTiming] = useState<{ duration: number; easing: Bezier } | null>(null);

  const value = useMemo<ChartMotion>(() => {
    function Stage({ kind, horizontal, children: plot, className }: ChartStageProps) {
      const ref = useRef<HTMLDivElement>(null);
      useFirstView(
        ref,
        (element) => {
          const tokens = readMotionTokens(element);
          if (tokens !== null) {
            setTiming({ duration: tokens.duration.slow * 1000, easing: tokens.easing.standard });
          }
          return enter(element, { kind, horizontal }, () => {
            setEntered(true);
          });
        },
        !plain,
      );
      return (
        <div
          ref={ref}
          // Hidden until its first view starts the entrance; never set when motion is off.
          data-enter={plain ? undefined : 'waiting'}
          className={cn(
            'data-[enter=waiting]:[&_.recharts-line]:opacity-0',
            'data-[enter=waiting]:[&_.recharts-line-dots]:opacity-0',
            'data-[enter=waiting]:[&_.recharts-area]:opacity-0',
            'data-[enter=waiting]:[&_.recharts-bar-rectangle]:opacity-0',
            'data-[enter=waiting]:[&_.recharts-pie-sector]:opacity-0',
            className,
          )}
        >
          {plot}
        </div>
      );
    }
    return { Stage, animateUpdates: false, updateDuration: 0 };
    // The stage is a component: its identity stays put unless the motion preference changes.
  }, [plain]);

  const motion = useMemo<ChartMotion>(
    () =>
      !plain && entered && timing !== null
        ? {
            Stage: value.Stage,
            animateUpdates: true,
            updateDuration: timing.duration,
            updateEasing: bezier(timing.easing),
          }
        : value,
    [plain, entered, timing, value],
  );

  return <ChartMotionProvider value={motion}>{children}</ChartMotionProvider>;
}

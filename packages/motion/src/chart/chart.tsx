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

// The end dot is listed on its own: Recharts may draw dots outside the line's group.
const LINES = '.recharts-line, .recharts-line-dots, .recharts-area, .rx-end-dot';
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
  const tips: (() => void)[] = [];
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
      // Every mark is clipped in the frame of the whole chart (view-box), so a line, its dots and
      // its area share one moving edge that starts at the plot's left side and no dot runs ahead.
      const plot = root.querySelector<SVGGraphicsElement>('.recharts-cartesian-grid')?.getBBox();
      const width = root.querySelector('svg.recharts-surface')?.clientWidth ?? 0;
      const hidden = plot === undefined || width === 0 ? '100%' : `${String(width - plot.x)}px`;
      for (const mark of root.querySelectorAll<SVGGraphicsElement>(LINES)) {
        animations.push(
          mark.animate(
            [
              { clipPath: `inset(0 ${hidden} 0 0) view-box` },
              { clipPath: 'inset(0 0 0 0) view-box' },
            ],
            {
              duration: tokens.duration.count * 1000,
              easing: cssEasing(root, 'settle'),
              fill: 'backwards',
            },
          ),
        );
      }
      const clip = animations.at(-1);
      if (plot !== undefined && clip !== undefined)
        tips.push(...leadingTips(root, plot.x, width, clip));
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
    for (const stop of tips) stop();
  };
}

/**
 * A dot riding the moving edge of each line while it draws, so the line reads as being drawn
 * rather than cut off. It follows the clip edge across the plot, finds the line's height there on
 * the path, and leaves when the draw ends (the line's own end dot takes over). Returns stoppers.
 */
function leadingTips(
  root: HTMLElement,
  left: number,
  width: number,
  clip: Animation,
): (() => void)[] {
  return [...root.querySelectorAll<SVGPathElement>('.recharts-line-curve, .recharts-area-curve')]
    .filter((path) => typeof path.getTotalLength === 'function')
    .map((path) => {
      let total = 0;
      try {
        total = path.getTotalLength();
      } catch {
        return () => undefined;
      }
      const tip = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      tip.setAttribute('r', '3.5');
      tip.setAttribute('fill', path.getAttribute('stroke') ?? 'currentColor');
      tip.setAttribute('stroke', 'var(--rx-chart-halo)');
      tip.setAttribute('stroke-width', '2');
      tip.setAttribute('aria-hidden', 'true');
      // On the surface itself, outside the clipped marks, so the edge never cuts the dot in half.
      (path.ownerSVGElement ?? path.parentNode)?.append(tip);
      // The point on the path at a given x: the path runs left to right, so search by length.
      const at = (x: number) => {
        let low = 0;
        let high = total;
        for (let i = 0; i < 18; i += 1) {
          const mid = (low + high) / 2;
          if (path.getPointAtLength(mid).x < x) low = mid;
          else high = mid;
        }
        return path.getPointAtLength(high);
      };
      let frame = 0;
      // Read the clip's own eased progress, so the dot sits exactly on the edge the line is cut at.
      const step = () => {
        const progress = clip.effect?.getComputedTiming().progress;
        if (clip.playState === 'finished' || progress === null || progress === undefined) {
          tip.remove();
          return;
        }
        const point = at(left + progress * (width - left));
        tip.setAttribute('cx', String(point.x));
        tip.setAttribute('cy', String(point.y));
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
      return () => {
        cancelAnimationFrame(frame);
        tip.remove();
      };
    });
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

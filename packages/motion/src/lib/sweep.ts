import { cssEasing } from './first-view';
import { readMotionTokens } from './tokens';

/**
 * The entrance of a measured value: the arc or the fill grows from nothing to the figure on the
 * `count` duration with the `settle` easing (even, then a soft landing, never past the mark), and
 * the figure fades up as the arc nears it. Runs on the Web Animations API, transform, opacity and
 * the arc's dash only, and leaves no inline style behind.
 */
export function sweepIn(root: Element): (() => void) | undefined {
  const tokens = readMotionTokens(root);
  if (tokens === null) return undefined;
  const timing = {
    duration: tokens.duration.count * 1000,
    delay: tokens.duration.base * 1000,
    easing: cssEasing(root, 'settle'),
    // Backwards: the empty state holds through the delay instead of flashing the full one.
    fill: 'backwards' as const,
  };
  const running: Animation[] = [];
  for (const arc of root.querySelectorAll<SVGElement>('[data-part="arc"]')) {
    const to = arc.getAttribute('stroke-dasharray');
    if (to === null) continue;
    running.push(arc.animate([{ strokeDasharray: '0 100' }, { strokeDasharray: to }], timing));
  }
  root.querySelectorAll<HTMLElement>('[data-part="fill"]').forEach((fill, i) => {
    const to = fill.style.transform;
    if (to === '') return;
    running.push(
      fill.animate([{ transform: 'scaleX(0)' }, { transform: to }], {
        ...timing,
        // Segments fill one after another, each a little later than the last.
        delay: timing.delay + i * tokens.duration.base * 400,
      }),
    );
  });
  for (const figure of root.querySelectorAll<HTMLElement>('[data-part="figure"]')) {
    running.push(
      figure.animate(
        [
          { opacity: 0, transform: `translateY(${tokens.distance.shift})` },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        {
          duration: tokens.duration.slow * 1000,
          delay: timing.delay + timing.duration * 0.4,
          easing: cssEasing(root, 'enter'),
          fill: 'backwards',
        },
      ),
    );
  }
  return () => {
    for (const animation of running) animation.cancel();
  };
}

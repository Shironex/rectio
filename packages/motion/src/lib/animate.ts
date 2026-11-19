import { spring } from 'motion';
import { animate } from 'motion/mini';

import type { Bezier, SpringToken } from './tokens';

/**
 * Every animation in the add-on runs on the Web Animations API through Motion's mini animator
 * (about 4.5 kB with the spring generator, against 30 kB for LazyMotion with `m`). WAAPI runs off
 * the main thread for transform and opacity, and it is what Base UI's `getAnimations()` waits for
 * before it unmounts a closing popup, so exits finish without extra wiring.
 */

type Keyframes = Parameters<typeof animate>[1];
export type Controls = ReturnType<typeof animate>;

/** A spring from the tokens. Springs carry their own duration. */
export function springTo(element: Element, keyframes: Keyframes, physics: SpringToken): Controls {
  return animate(element, keyframes, { type: spring, ...physics });
}

/** A tween with a token duration (seconds) and easing. */
export function tweenTo(
  element: Element,
  keyframes: Keyframes,
  duration: number,
  ease: Bezier,
  delay = 0,
): Controls {
  return animate(element, keyframes, { duration, ease, delay });
}

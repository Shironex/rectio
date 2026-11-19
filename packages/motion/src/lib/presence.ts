import { useLayoutEffect, useState, type RefObject } from 'react';

import { cssEasing } from './first-view';
import { readMotionTokens } from './tokens';

/**
 * Keeps an element rendered while it leaves. Returns whether to render it: true while `visible`,
 * and for as long as its exit runs after `visible` turns false. The exit fades it out and lifts it
 * by the shift distance on the fast duration, quicker than any entrance.
 */
export function usePresence(visible: boolean, ref: RefObject<HTMLElement | null>): boolean {
  const [shown, setShown] = useState(visible);
  const [exiting, setExiting] = useState(false);
  // Adjusted while rendering, React's pattern for state that follows a prop.
  if (visible && (!shown || exiting)) {
    setShown(true);
    setExiting(false);
  } else if (!visible && shown && !exiting) {
    setExiting(true);
  }

  useLayoutEffect(() => {
    const element = ref.current;
    if (!exiting) return;
    const tokens = element === null ? null : readMotionTokens(element);
    const animation =
      element === null
        ? null
        : element.animate(
            tokens === null
              ? []
              : [
                  { opacity: 1, transform: 'translateY(0)' },
                  { opacity: 0, transform: `translateY(calc(-1 * ${tokens.distance.shift}))` },
                ],
            {
              duration: tokens === null ? 0 : tokens.duration.fast * 1000,
              // Fast out, never an ease-in: the element is mostly gone at once.
              easing: tokens === null ? 'linear' : cssEasing(element, 'standard'),
              fill: 'forwards',
            },
          );
    const done = () => {
      setShown(false);
      setExiting(false);
    };
    if (animation === null) {
      queueMicrotask(done);
      return;
    }
    animation.onfinish = done;
    return () => {
      animation.onfinish = null;
      animation.cancel();
    };
  }, [exiting, ref]);

  return shown;
}

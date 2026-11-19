import { useLayoutEffect, useRef, type RefObject } from 'react';

/** True when part of the element is inside the viewport right now. */
function onScreen(element: Element): boolean {
  const box = element.getBoundingClientRect();
  return box.bottom > 0 && box.right > 0 && box.top < innerHeight && box.left < innerWidth;
}

/**
 * Runs `start` once, the first time the element is on screen, and its cleanup on unmount. An
 * element already on screen starts before the first paint, so its resting state never flashes
 * before the entrance; one below the fold starts when it scrolls into view. Without
 * IntersectionObserver it starts at once, so nothing is left in a hidden state.
 */
export function useFirstView(
  ref: RefObject<Element | null>,
  start: (element: Element) => (() => void) | undefined,
  enabled = true,
) {
  // Read through a ref: the entrance plays once per mount, whatever the caller re-creates.
  const latest = useRef(start);
  useLayoutEffect(() => {
    latest.current = start;
  });
  useLayoutEffect(() => {
    const element = ref.current;
    if (!enabled || element === null) return;
    let cleanup: (() => void) | undefined;
    if (typeof IntersectionObserver === 'undefined' || onScreen(element)) {
      cleanup = latest.current(element);
      return cleanup;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        cleanup = latest.current(element);
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cleanup?.();
    };
  }, [ref, enabled]);
}

/** A motion easing token as CSS text, which is how the Web Animations API takes it. */
export function cssEasing(element: Element, name: 'standard' | 'enter' | 'exit' | 'settle') {
  return getComputedStyle(element).getPropertyValue(`--rx-motion-easing-${name}`).trim();
}

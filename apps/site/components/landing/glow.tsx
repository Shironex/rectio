'use client';

import { useEffect, useRef } from 'react';

import { prefersReducedMotion, readDuration, readEasing } from './motion-tokens';

/**
 * The page's one blurred accent, drifting on a long loop. It runs on the Web Animations API, so
 * it stays off the main thread, and it pauses whenever it is off screen. Reduced motion keeps it
 * still.
 */
export function Glow({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element === null || prefersReducedMotion()) return;
    const loop = readDuration('--rx-motion-duration-loop', element) * 30;
    const animation = element.animate(
      [
        { transform: 'translate(0, 0)' },
        { transform: 'translate(18%, 10%)' },
        { transform: 'translate(-8%, 16%)' },
        { transform: 'translate(0, 0)' },
      ],
      {
        duration: loop,
        iterations: Infinity,
        easing: readEasing('--rx-motion-easing-standard', element),
      },
    );
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting === true) animation.play();
      else animation.pause();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      animation.cancel();
    };
  }, []);

  return <div ref={ref} aria-hidden className={`site-glow ${className ?? ''}`} />;
}

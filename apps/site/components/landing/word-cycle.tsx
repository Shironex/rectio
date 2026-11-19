'use client';

import { useEffect, useState } from 'react';

import { readDuration, useReducedMotion } from './motion-tokens';

/**
 * Cycles through `words` once and settles on the last. Every word is laid out in one grid cell,
 * so the widest reserves the width and nothing around it reflows. Screen readers get the settled
 * sentence from the heading's own label; under reduced motion CSS shows only the last word.
 */
export function WordCycle({ words }: { words: readonly string[] }) {
  const [cycled, setIndex] = useState(0);
  const last = words.length - 1;
  const reduced = useReducedMotion();
  const index = reduced ? last : cycled;

  useEffect(() => {
    if (reduced) return;
    // A word holds long enough to be read, then the next rises in; the last one stays.
    const hold = readDuration('--rx-motion-duration-reveal') * 2.4;
    let current = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const next = () => {
      current += 1;
      setIndex(current);
      if (current < last) timer = setTimeout(next, hold);
    };
    timer = setTimeout(next, hold * 1.4);
    return () => {
      clearTimeout(timer);
    };
  }, [last, reduced]);

  return (
    <span className="site-cycle" aria-hidden>
      {words.map((word, i) => (
        <span
          key={word}
          data-state={i === index ? 'current' : i < index ? 'after' : 'before'}
          data-final={i === last ? '' : undefined}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

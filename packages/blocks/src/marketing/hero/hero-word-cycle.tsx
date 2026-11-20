'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { useMarketingParts } from '../lib/parts';
import { HeroCentered, type HeroCenteredProps } from './hero';

export interface HeroWordCycleProps extends Omit<HeroCenteredProps, 'title' | 'visual'> {
  /** The words before the cycling one, such as "Close the books on". */
  before: ReactNode;
  /** The words that take turns, such as invoices, payouts and approvals. */
  words: readonly string[];
  /** The words after the cycling one, if any. */
  after?: ReactNode;
  /**
   * What assistive technology reads in place of the cycling headline. Defaults to the words joined:
   * "Close the books on invoices, payouts and approvals".
   */
  srTitle?: string;
  /** Milliseconds each word stays. */
  interval?: number;
  /** How many times the words go round before the headline settles on the first word again. */
  loops?: number;
  visual?: ReactNode;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Steps through the words once per `interval`, `loops` times round, and settles on the first word.
 * Holds still while `paused`, while the tab is hidden and under reduced motion.
 */
export function useWordCycle(
  count: number,
  { interval, loops, paused }: { interval: number; loops: number; paused: boolean },
): number {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const total = count * loops;
  useEffect(() => {
    const onChange = () => {
      setVisible(document.visibilityState !== 'hidden');
    };
    document.addEventListener('visibilitychange', onChange);
    return () => {
      document.removeEventListener('visibilitychange', onChange);
    };
  }, []);
  useEffect(() => {
    if (paused || !visible || count < 2 || step >= total || prefersReducedMotion()) return;
    const timer = window.setTimeout(() => {
      setStep((value) => value + 1);
    }, interval);
    return () => {
      window.clearTimeout(timer);
    };
  }, [paused, visible, count, step, total, interval]);
  return count === 0 ? 0 : step % count;
}

function joinWords(words: readonly string[]): string {
  if (words.length < 2) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words.at(-1) ?? ''}`;
}

/**
 * A centred headline whose key noun takes turns: "Close the books on invoices", then payouts, then
 * approvals. The widest word reserves its width so nothing around it moves, the cycle holds while
 * hovered, settles after `loops` rounds, and assistive technology reads one stable sentence.
 */
export function HeroWordCycle({
  before,
  words,
  after,
  srTitle,
  interval = 2200,
  loops = 2,
  visual,
  className,
  ...copy
}: HeroWordCycleProps) {
  const { Swap } = useMarketingParts();
  const [paused, setPaused] = useState(false);
  const index = useWordCycle(words.length, { interval, loops, paused });
  const word = words[index] ?? '';
  const spoken =
    srTitle ??
    [
      typeof before === 'string' ? before : '',
      joinWords(words),
      typeof after === 'string' ? after : '',
    ]
      .filter((part) => part !== '')
      .join(' ');
  const title = (
    <span
      onPointerEnter={() => {
        setPaused(true);
      }}
      onPointerLeave={() => {
        setPaused(false);
      }}
    >
      <span className="sr-only">{spoken}</span>
      <span aria-hidden>
        {before}{' '}
        <span className="inline-grid justify-items-start overflow-hidden pb-1 text-start align-bottom">
          {/* Every word, invisible, in the same cell: the widest one sets the width. */}
          {words.map((each) => (
            <span key={each} className="invisible col-start-1 row-start-1 font-heading">
              {each}
            </span>
          ))}
          <Swap swapKey={word} className="col-start-1 row-start-1 font-heading text-accent-strong">
            {word}
          </Swap>
        </span>
        {after !== undefined && <> {after}</>}
      </span>
    </span>
  );
  return (
    <HeroCentered
      {...copy}
      title={title}
      {...(visual === undefined ? {} : { visual })}
      className={className}
    />
  );
}

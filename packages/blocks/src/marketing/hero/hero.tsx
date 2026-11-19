import { cn } from '@rectio/ui';
import { useEffect, useId, useState, type ReactNode } from 'react';

import { Actions, type MarketingAction } from '../lib/action';
import { useMarketingParts } from '../lib/parts';
import { Container, Eyebrow } from '../lib/section';

interface HeroCopy {
  /** The headline. Mix weights by wrapping the words to stress in `<Em>`. */
  title: ReactNode;
  /** One sentence under the headline; twenty words at most reads in a glance. */
  description?: ReactNode;
  /** A rule-and-label line above the headline, or a short announcement. */
  eyebrow?: ReactNode;
  primary?: MarketingAction;
  secondary?: MarketingAction;
}

export interface HeroCenteredProps extends HeroCopy {
  /** Your product, rendered live: it rises under the copy and fades out at the fold. */
  visual?: ReactNode;
  className?: string | undefined;
}

export interface HeroSplitProps extends HeroCopy {
  /** Your product, rendered live, beside the copy. */
  visual: ReactNode;
  /** Put the visual on the left. */
  reverse?: boolean;
  className?: string;
}

export type FloatingCardPosition = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

export interface FloatingCard {
  id: string;
  /** A small piece of real UI: an approval, a figure, a status. */
  content: ReactNode;
  position: FloatingCardPosition;
}

export interface HeroFloatingProps extends HeroCopy {
  /** The main visual, framed. */
  visual: ReactNode;
  /** Up to four cards that float over the visual's corners on wide screens and line up under it on narrow ones (two on a phone). */
  cards: readonly FloatingCard[];
  className?: string;
}

export interface HeroWordCycleProps extends Omit<HeroCopy, 'title'> {
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
  className?: string;
}

const TITLE = 'font-display text-4xl font-regular tracking-tight text-balance text-fg sm:text-5xl';

function Copy({
  title,
  description,
  eyebrow,
  primary,
  secondary,
  align,
  titleId,
}: Omit<HeroCopy, 'title'> & {
  title: ReactNode;
  align: 'start' | 'center';
  titleId: string;
}) {
  const { Reveal } = useMarketingParts();
  return (
    <Reveal
      stagger
      className={cn(
        'flex flex-col gap-6',
        align === 'center' ? 'mx-auto max-w-3xl items-center text-center' : 'max-w-xl',
      )}
    >
      {eyebrow !== undefined && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 id={titleId} className={TITLE}>
        {title}
      </h1>
      {description !== undefined && (
        <p className="max-w-xl text-lg text-pretty text-fg-muted sm:text-xl">{description}</p>
      )}
      <Actions primary={primary} secondary={secondary} align={align} />
    </Reveal>
  );
}

/** The frame a hero visual sits in: a raised panel with the overlay shadow. */
export function HeroFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-panel border border-line bg-surface p-2 shadow-overlay sm:p-3',
        '[&>*]:rounded-panel',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A small card that floats over a hero visual: real UI at a glance. */
export function FloatingCardFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-panel border border-line bg-surface-raised p-4 text-fg shadow-overlay',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Copy centred over a soft tinted wash, with the product rising underneath and fading out at the
 * fold: the message first, then the proof.
 */
export function HeroCentered({ visual, className, ...copy }: HeroCenteredProps) {
  const { Reveal } = useMarketingParts();
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      data-slot="hero"
      className={cn(
        'overflow-hidden bg-linear-to-b from-accent-subtle via-surface-canvas to-surface-canvas pt-16 text-fg sm:pt-24',
        visual === undefined && 'pb-16 sm:pb-24',
        className,
      )}
    >
      <Container>
        <Copy {...copy} align="center" titleId={titleId} />
        {visual !== undefined && (
          <Reveal className="relative mx-auto mt-14 max-w-5xl sm:mt-16">
            <div className="mask-b-from-60% mask-b-to-100%">
              <HeroFrame>{visual}</HeroFrame>
            </div>
          </Reveal>
        )}
      </Container>
    </section>
  );
}

/** Copy on one side, the product on the other; stacked on narrow screens with the copy first. */
export function HeroSplit({ visual, reverse = false, className, ...copy }: HeroSplitProps) {
  const { Reveal } = useMarketingParts();
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      data-slot="hero"
      className={cn('overflow-hidden py-16 text-fg sm:py-24', className)}
    >
      <Container width="wide" className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div className={cn('lg:col-span-5', reverse && 'lg:order-last')}>
          <Copy {...copy} align="start" titleId={titleId} />
        </div>
        <Reveal className="lg:col-span-7">
          <HeroFrame>{visual}</HeroFrame>
        </Reveal>
      </Container>
    </section>
  );
}

const CORNER: Record<FloatingCardPosition, string> = {
  'top-start': 'md:top-0 md:-start-6',
  'top-end': 'md:top-3 md:-end-6',
  'bottom-start': 'md:bottom-0 md:-start-8',
  'bottom-end': 'md:-end-6 md:bottom-2',
};

/**
 * Copy above a framed visual with small cards of real UI floating over its corners: an approval
 * landing, a figure moving, a status changing. On narrow screens the cards line up under the
 * visual instead of covering it.
 */
export function HeroFloating({ visual, cards, className, ...copy }: HeroFloatingProps) {
  const { Reveal } = useMarketingParts();
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      data-slot="hero"
      className={cn(
        'overflow-hidden bg-linear-to-b from-accent-subtle to-surface-canvas to-60% pt-10 pb-12 text-fg sm:pt-12 sm:pb-16',
        className,
      )}
    >
      <Container width="wide" className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <Copy {...copy} align="start" titleId={titleId} />
        </div>
        {/* The padding leaves room for the cards to hang off the frame without covering its header. */}
        <div className="relative md:px-12 md:pt-28 md:pb-20 lg:col-span-7 lg:px-0">
          <Reveal>
            <HeroFrame>{visual}</HeroFrame>
          </Reveal>
          <Reveal
            stagger
            as="ul"
            aria-label="Highlights"
            className="mt-4 grid gap-3 sm:grid-cols-2 md:pointer-events-none md:absolute md:inset-0 md:mt-0 md:block"
          >
            {cards.slice(0, 4).map((card, index) => (
              <li
                key={card.id}
                // A phone shows two: the rest repeat the story and push the next section away.
                className={cn(
                  'md:pointer-events-auto md:absolute md:w-64',
                  index >= 2 && 'max-sm:hidden',
                  CORNER[card.position],
                )}
              >
                <FloatingCardFrame>{card.content}</FloatingCardFrame>
              </li>
            ))}
          </Reveal>
        </div>
      </Container>
    </section>
  );
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

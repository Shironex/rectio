import { cn } from '@rectio/ui';
import { useId, type ReactNode } from 'react';

import { Actions, type MarketingAction } from '../lib/action';
import { useMarketingParts } from '../lib/parts';
import { Container, Eyebrow } from '../lib/section';

/**
 * The background behind a hero: `accent`, a soft tint of the accent fading into the page;
 * `neutral`, the same fade from the sunken surface; `none`, the bare page.
 */
export type HeroWash = 'accent' | 'neutral' | 'none';

interface HeroBackground {
  /** The tinted wash behind the hero. Each layout has its own default. */
  wash?: HeroWash | undefined;
  /**
   * Your own layer behind the content, such as a pattern or a picture, drawn over the wash and
   * hidden from assistive technology. Pair it with `wash="none"` to replace the wash outright.
   */
  backdrop?: ReactNode;
}

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

export interface HeroCenteredProps extends HeroCopy, HeroBackground {
  /** Your product, rendered live: it rises under the copy and fades out at the fold. */
  visual?: ReactNode;
  className?: string | undefined;
}

export interface HeroSplitProps extends HeroCopy, HeroBackground {
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

export interface HeroFloatingProps extends HeroCopy, HeroBackground {
  /** The main visual, framed. */
  visual: ReactNode;
  /** Up to four cards that float over the visual's corners on wide screens and line up under it on narrow ones (two on a phone). */
  cards: readonly FloatingCard[];
  className?: string;
}

// Tokens only: each wash fades from a soft surface into the page canvas.
const WASH: Record<HeroWash, string> = {
  accent: 'bg-linear-to-b from-accent-subtle via-surface-canvas to-surface-canvas',
  neutral: 'bg-linear-to-b from-surface-sunken via-surface-canvas to-surface-canvas',
  none: '',
};

// The floating layout's fade ends higher: its cards hang over the bare page.
const FLOATING_WASH: Record<HeroWash, string> = {
  accent: 'bg-linear-to-b from-accent-subtle to-surface-canvas to-60%',
  neutral: 'bg-linear-to-b from-surface-sunken to-surface-canvas to-60%',
  none: '',
};

/** The backdrop layer: behind the content, inert and unheard. */
function Backdrop({ children }: { children: ReactNode }) {
  if (children === undefined || children === null || children === false) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {children}
    </div>
  );
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
export function HeroCentered({
  visual,
  wash = 'accent',
  backdrop,
  className,
  ...copy
}: HeroCenteredProps) {
  const { Reveal } = useMarketingParts();
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      data-slot="hero"
      className={cn(
        'relative isolate overflow-hidden pt-16 text-fg sm:pt-24',
        WASH[wash],
        visual === undefined && 'pb-16 sm:pb-24',
        className,
      )}
    >
      <Backdrop>{backdrop}</Backdrop>
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
export function HeroSplit({
  visual,
  reverse = false,
  wash = 'none',
  backdrop,
  className,
  ...copy
}: HeroSplitProps) {
  const { Reveal } = useMarketingParts();
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      data-slot="hero"
      className={cn(
        'relative isolate overflow-hidden py-16 text-fg sm:py-24',
        WASH[wash],
        className,
      )}
    >
      <Backdrop>{backdrop}</Backdrop>
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
export function HeroFloating({
  visual,
  cards,
  wash = 'accent',
  backdrop,
  className,
  ...copy
}: HeroFloatingProps) {
  const { Reveal } = useMarketingParts();
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      data-slot="hero"
      className={cn(
        'relative isolate overflow-hidden pt-10 pb-12 text-fg sm:pt-12 sm:pb-16',
        FLOATING_WASH[wash],
        className,
      )}
    >
      <Backdrop>{backdrop}</Backdrop>
      <Container width="wide" className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <Copy {...copy} align="start" titleId={titleId} />
        </div>
        {/* The padding leaves room for the cards to hang off the frame without covering its header. */}
        <div className="relative md:px-12 md:pt-24 md:pb-16 lg:col-span-7 lg:px-0">
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

'use client';

import { cn } from '@rectio/ui';

import { ConfirmedCard, PublishedCard, RequestCard, SwapCard } from '@/components/visuals/cards';
import type { Article } from '@/data/blog';

const COVER: Record<Article['cover'], { tone: string; card: () => React.ReactNode }> = {
  published: { tone: 'from-accent-subtle', card: () => <PublishedCard /> },
  coverage: { tone: 'from-positive-subtle', card: () => <ConfirmedCard /> },
  swap: { tone: 'from-info-subtle', card: () => <SwapCard /> },
  request: { tone: 'from-warning-subtle', card: () => <RequestCard /> },
};

/** A cover made of the product itself: a tinted field holding one card, shown as a picture. */
export function ArticleCover({
  cover,
  className,
}: {
  cover: Article['cover'];
  className?: string;
}) {
  const { tone, card } = COVER[cover];
  return (
    <div
      className={cn(
        'flex size-full items-center justify-center bg-linear-to-br to-surface-sunken p-6',
        tone,
        className,
      )}
    >
      {/* A picture of the product: inert, so the card's link stays the only thing to click. */}
      <div
        inert
        aria-hidden
        className="w-full max-w-64 rounded-panel border border-line bg-surface-raised p-4 shadow-overlay"
      >
        {card()}
      </div>
    </div>
  );
}

import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { Accordion } from '../lib/accordion';
import { useMarketingParts } from '../lib/parts';
import { Section, SectionHeader, useHeadingId, type SectionTone } from '../lib/section';

export interface FaqItem {
  id: string;
  question: string;
  answer: ReactNode;
}

export interface FaqProps {
  items: readonly FaqItem[];
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  /**
   * `accordion` opens one answer at a time beside the heading; `numbered` shows every answer at
   * once in two numbered columns, for a short list that should be read in full.
   */
  variant?: 'accordion' | 'numbered';
  /** Something under the heading, such as a link to support or a small card of live UI. */
  aside?: ReactNode;
  /** Ids of the answers open at first in the accordion, such as the most asked question. */
  defaultOpen?: string[];
  tone?: SectionTone;
  className?: string;
}

/**
 * Frequently asked questions. The accordion keeps closed answers findable with find in page; the
 * numbered list suits five or six questions everyone should read.
 */
export function Faq({
  items,
  title,
  description,
  eyebrow,
  variant = 'accordion',
  aside,
  defaultOpen,
  tone,
  className,
}: FaqProps) {
  const { Reveal } = useMarketingParts();
  const headingId = useHeadingId();
  const header = (
    <SectionHeader id={headingId} title={title} description={description} eyebrow={eyebrow}>
      {aside !== undefined && <div className="mt-4">{aside}</div>}
    </SectionHeader>
  );
  if (variant === 'numbered') {
    return (
      <Section tone={tone} width="wide" labelledBy={headingId} className={className}>
        {header}
        <Reveal as="ol" stagger className="mt-14 grid gap-x-12 gap-y-12 @3xl:grid-cols-2">
          {items.map((item, index) => (
            <li key={item.id} className="flex gap-5 border-t border-line pt-6">
              <span
                aria-hidden
                className="font-display text-2xl font-regular text-accent-strong tabular-nums"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex min-w-0 flex-col gap-2">
                <h3 className="text-lg font-strong text-pretty text-fg">{item.question}</h3>
                <div className="text-base text-pretty text-fg-muted">{item.answer}</div>
              </div>
            </li>
          ))}
        </Reveal>
      </Section>
    );
  }
  return (
    <Section tone={tone} width="wide" labelledBy={headingId} className={className}>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className={cn('lg:col-span-5')}>
          <div className="lg:sticky lg:top-24">{header}</div>
        </div>
        <Reveal className="lg:col-span-7">
          <Accordion
            items={items.map((item) => ({
              id: item.id,
              title: item.question,
              content: item.answer,
            }))}
            {...(defaultOpen === undefined ? {} : { defaultOpen })}
          />
        </Reveal>
      </div>
    </Section>
  );
}

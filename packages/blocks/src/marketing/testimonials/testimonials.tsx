import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { Avatar } from '../lib/avatar';
import { Marquee } from '../lib/marquee';
import { useMarketingParts } from '../lib/parts';
import { Section, SectionHeader, useHeadingId, type SectionTone } from '../lib/section';

export interface Testimonial {
  id: string;
  /** The words, without quotation marks: the block adds them. Three lines at most reads best. */
  quote: string;
  name: string;
  role: string;
  company?: string;
  /** A photo of the person. Without one their initials show. */
  avatar?: string;
}

export interface TestimonialQuoteProps {
  testimonial: Testimonial;
  /** A result beside the quote, such as "3 days" and "to close the month, down from 9". */
  metric?: { value: string; label: string };
  tone?: SectionTone;
  className?: string;
}

interface TestimonialListProps {
  testimonials: readonly Testimonial[];
  title?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  tone?: SectionTone;
  className?: string;
}

export type TestimonialGridProps = TestimonialListProps;
export type TestimonialMarqueeProps = TestimonialListProps;

function Person({ testimonial, size = 'md' }: { testimonial: Testimonial; size?: 'md' | 'lg' }) {
  const role = [testimonial.role, testimonial.company].filter(Boolean).join(', ');
  return (
    <figcaption className="flex items-center gap-3">
      <Avatar name={testimonial.name} src={testimonial.avatar} size={size} />
      <span className="flex min-w-0 flex-col">
        <span className="font-medium text-fg">{testimonial.name}</span>
        <span className="text-sm text-fg-muted">{role}</span>
      </span>
    </figcaption>
  );
}

/** One quote, large, with the person behind it and an optional result beside it. */
export function TestimonialQuote({ testimonial, metric, tone, className }: TestimonialQuoteProps) {
  const { Reveal } = useMarketingParts();
  return (
    <Section tone={tone} label={`What ${testimonial.name} says`} className={className}>
      <Reveal className={cn('grid gap-12', metric !== undefined && 'lg:grid-cols-12 lg:gap-16')}>
        <figure className={cn('flex flex-col gap-8', metric !== undefined && 'lg:col-span-8')}>
          <blockquote className="font-display text-2xl font-regular tracking-tight text-balance text-fg sm:text-3xl">
            <p>
              <span aria-hidden className="text-fg-subtle">
                “
              </span>
              {testimonial.quote}
              <span aria-hidden className="text-fg-subtle">
                ”
              </span>
            </p>
          </blockquote>
          <Person testimonial={testimonial} size="lg" />
        </figure>
        {metric !== undefined && (
          <div className="flex flex-col justify-end gap-2 border-t border-line pt-8 lg:col-span-4 lg:border-t-0 lg:border-s lg:ps-10 lg:pt-0">
            <p className="font-display text-5xl font-regular tracking-tight text-accent-strong tabular-nums">
              {metric.value}
            </p>
            <p className="text-base text-pretty text-fg-muted">{metric.label}</p>
          </div>
        )}
      </Reveal>
    </Section>
  );
}

function QuoteCard({ testimonial, className }: { testimonial: Testimonial; className?: string }) {
  return (
    <figure
      className={cn(
        'flex flex-col gap-6 rounded-panel border border-line bg-surface p-6 text-fg',
        className,
      )}
    >
      <blockquote className="text-base text-pretty text-fg">
        <p>“{testimonial.quote}”</p>
      </blockquote>
      <Person testimonial={testimonial} />
    </figure>
  );
}

/**
 * Quotes in columns of uneven height, read top to bottom, so short and long quotes sit together
 * without gaps. The first quote is set larger as the lead.
 */
export function TestimonialGrid({
  testimonials,
  title,
  description,
  eyebrow,
  tone,
  className,
}: TestimonialGridProps) {
  const { Reveal } = useMarketingParts();
  const headingId = useHeadingId();
  return (
    <Section
      tone={tone}
      width="wide"
      {...(title === undefined ? { label: 'Testimonials' } : { labelledBy: headingId })}
      className={className}
    >
      {title !== undefined && (
        <SectionHeader
          id={headingId}
          title={title}
          description={description}
          eyebrow={eyebrow}
          className="mb-12"
        />
      )}
      <Reveal as="ul" stagger className="columns-1 gap-4 @2xl:columns-2 @5xl:columns-3">
        {testimonials.map((testimonial, index) => (
          <li key={testimonial.id} className="mb-4 break-inside-avoid">
            <QuoteCard
              testimonial={testimonial}
              className={cn(
                index === 0 &&
                  'border-transparent bg-linear-to-b from-accent-subtle to-surface [&_blockquote]:font-display [&_blockquote]:text-xl [&_blockquote]:tracking-tight',
              )}
            />
          </li>
        ))}
      </Reveal>
    </Section>
  );
}

/**
 * A wall of quotes in two rows drifting in opposite directions. It stops on hover and focus, has a
 * pause button, and under reduced motion the quotes simply wrap. One moving strip per page: pair
 * it with a static logo strip.
 */
export function TestimonialMarquee({
  testimonials,
  title,
  description,
  eyebrow,
  tone,
  className,
}: TestimonialMarqueeProps) {
  const { Reveal } = useMarketingParts();
  const headingId = useHeadingId();
  const half = Math.ceil(testimonials.length / 2);
  const rows = [testimonials.slice(0, half), testimonials.slice(half)].filter(
    (row) => row.length > 0,
  );
  return (
    <Section
      tone={tone}
      width="wide"
      {...(title === undefined ? { label: 'Testimonials' } : { labelledBy: headingId })}
      className={className}
    >
      {title !== undefined && (
        <SectionHeader
          id={headingId}
          title={title}
          description={description}
          eyebrow={eyebrow}
          align="center"
          className="mb-12"
        />
      )}
      <Reveal className="flex flex-col gap-4">
        {rows.map((row, index) => (
          <Marquee
            // Two fixed rows: the index is the row.
            key={index === 0 ? 'first' : 'second'}
            label={index === 0 ? 'Testimonials' : 'More testimonials'}
            reverse={index === 1}
            itemClassName="w-80 whitespace-normal"
          >
            {row.map((testimonial) => (
              <QuoteCard key={testimonial.id} testimonial={testimonial} className="h-full" />
            ))}
          </Marquee>
        ))}
      </Reveal>
    </Section>
  );
}

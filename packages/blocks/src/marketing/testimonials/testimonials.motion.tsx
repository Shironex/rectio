import { motioned } from '../lib/motion-parts';
import {
  TestimonialQuote as PlainTestimonialQuote,
  TestimonialGrid as PlainTestimonialGrid,
  TestimonialMarquee as PlainTestimonialMarquee,
  type TestimonialQuoteProps,
  type TestimonialGridProps,
  type TestimonialMarqueeProps,
} from './testimonials';

export type { TestimonialQuoteProps, TestimonialGridProps, TestimonialMarqueeProps };

/** TestimonialQuote with entrances that play once, on first view; plain under reduced motion. */
export const TestimonialQuote = motioned<TestimonialQuoteProps>(
  PlainTestimonialQuote,
  'TestimonialQuote',
);
/** TestimonialGrid with entrances that play once, on first view; plain under reduced motion. */
export const TestimonialGrid = motioned<TestimonialGridProps>(
  PlainTestimonialGrid,
  'TestimonialGrid',
);
/** TestimonialMarquee with entrances that play once, on first view; plain under reduced motion. */
export const TestimonialMarquee = motioned<TestimonialMarqueeProps>(
  PlainTestimonialMarquee,
  'TestimonialMarquee',
);

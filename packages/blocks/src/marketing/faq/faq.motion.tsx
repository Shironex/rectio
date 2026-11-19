import { motioned } from '../lib/motion-parts';
import { Faq as PlainFaq, type FaqProps } from './faq';

export type { FaqProps };

/** Faq with entrances that play once, on first view; plain under reduced motion. */
export const Faq = motioned<FaqProps>(PlainFaq, 'Faq');

import { motioned } from '../lib/motion-parts';
import { Newsletter as PlainNewsletter, type NewsletterProps } from './newsletter';

export type { NewsletterProps };

/** Newsletter with entrances that play once, on first view; plain under reduced motion. */
export const Newsletter = motioned<NewsletterProps>(PlainNewsletter, 'Newsletter');

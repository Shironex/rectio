import { motioned } from '../lib/motion-parts';
import { CtaBand as PlainCtaBand, type CtaBandProps } from './cta-band';

export type { CtaBandProps };

/** CtaBand with entrances that play once, on first view; plain under reduced motion. */
export const CtaBand = motioned<CtaBandProps>(PlainCtaBand, 'CtaBand');

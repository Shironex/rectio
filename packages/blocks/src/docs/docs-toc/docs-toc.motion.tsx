import { motioned } from '../lib/motion-parts';
import { DocsToc as PlainDocsToc, type DocsTocProps } from './docs-toc';

export type { DocsTocProps };

/** DocsToc whose marker glides between headings; it jumps under reduced motion. */
export const DocsToc = motioned<DocsTocProps>(PlainDocsToc, 'DocsToc');

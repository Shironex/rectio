import { motioned } from '../lib/motion-parts';
import { StatRow as PlainStatRow, type StatRowProps } from './stat-row';

export type { StatRowProps };

/** StatRow with entrances that play once, on first view; plain under reduced motion. */
export const StatRow = motioned<StatRowProps>(PlainStatRow, 'StatRow');

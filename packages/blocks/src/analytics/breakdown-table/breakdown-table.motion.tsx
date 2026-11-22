import { ChartMotionParts } from '@rectio/motion/charts';

import { MotionParts } from '../../lib/motion-parts';
import { BreakdownTable as PlainBreakdownTable, type BreakdownTableProps } from './breakdown-table';

export type { BreakdownTableProps };

/** BreakdownTable with the motion parts: the rows fade up on first view and the figures count. Plain under reduced motion. */
export function BreakdownTable(props: BreakdownTableProps) {
  return (
    <MotionParts>
      <ChartMotionParts>
        <PlainBreakdownTable {...props} />
      </ChartMotionParts>
    </MotionParts>
  );
}

import { ChartMotionParts } from '@rectio/motion/charts';

import { MotionParts } from '../../lib/motion-parts';
import { FunnelCard as PlainFunnelCard, type FunnelCardProps } from './funnel-card';

export type { FunnelCardProps };

/** FunnelCard with the motion parts: the stages grow from the start edge one after another on first view. Plain under reduced motion. */
export function FunnelCard(props: FunnelCardProps) {
  return (
    <MotionParts>
      <ChartMotionParts>
        <PlainFunnelCard {...props} />
      </ChartMotionParts>
    </MotionParts>
  );
}

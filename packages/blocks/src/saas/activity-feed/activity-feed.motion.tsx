import { SaasMotionParts } from '../lib/saas-motion-parts';
import { ActivityFeed as PlainActivityFeed, type ActivityFeedProps } from './activity-feed';

export type { ActivityFeedProps };

/** ActivityFeed with the motion parts: same props, plain under reduced motion. */
export function ActivityFeed(props: ActivityFeedProps) {
  return (
    <SaasMotionParts>
      <PlainActivityFeed {...props} />
    </SaasMotionParts>
  );
}

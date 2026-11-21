import { SaasMotionParts } from '../lib/saas-motion-parts';
import { Sessions as PlainSessions, type SessionsProps } from './sessions';

export type { SessionsProps };

/** Sessions with the motion parts: a signed-out session leaves and the rows below close the gap. */
export function Sessions(props: SessionsProps) {
  return (
    <SaasMotionParts>
      <PlainSessions {...props} />
    </SaasMotionParts>
  );
}

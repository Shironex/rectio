import { SaasMotionParts } from '../lib/saas-motion-parts';
import { TeamMembers as PlainTeamMembers, type TeamMembersProps } from './team-members';

export type { TeamMembersProps };

/** TeamMembers with the motion parts: same props, plain under reduced motion. */
export function TeamMembers(props: TeamMembersProps) {
  return (
    <SaasMotionParts>
      <PlainTeamMembers {...props} />
    </SaasMotionParts>
  );
}

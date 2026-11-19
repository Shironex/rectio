import { SaasMotionParts } from '../lib/saas-motion-parts';
import {
  ProfileSettings as PlainProfileSettings,
  type ProfileSettingsProps,
} from './profile-settings';

export type { ProfileSettingsProps };

/** ProfileSettings with the motion parts: same props, plain under reduced motion. */
export function ProfileSettings(props: ProfileSettingsProps) {
  return (
    <SaasMotionParts>
      <PlainProfileSettings {...props} />
    </SaasMotionParts>
  );
}

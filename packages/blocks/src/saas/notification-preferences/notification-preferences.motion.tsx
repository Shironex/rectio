import { SaasMotionParts } from '../lib/saas-motion-parts';
import {
  NotificationPreferences as PlainNotificationPreferences,
  type NotificationPreferencesProps,
} from './notification-preferences';

export type { NotificationPreferencesProps };

/** NotificationPreferences with the motion parts: same props, plain under reduced motion. */
export function NotificationPreferences(props: NotificationPreferencesProps) {
  return (
    <SaasMotionParts>
      <PlainNotificationPreferences {...props} />
    </SaasMotionParts>
  );
}

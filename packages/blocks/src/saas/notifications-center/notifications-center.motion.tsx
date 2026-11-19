import { SaasMotionParts } from '../lib/saas-motion-parts';
import {
  NotificationsCenter as PlainNotificationsCenter,
  type NotificationsCenterProps,
} from './notifications-center';

export type { NotificationsCenterProps };

/** NotificationsCenter with the motion parts: same props, plain under reduced motion. */
export function NotificationsCenter(props: NotificationsCenterProps) {
  return (
    <SaasMotionParts>
      <PlainNotificationsCenter {...props} />
    </SaasMotionParts>
  );
}

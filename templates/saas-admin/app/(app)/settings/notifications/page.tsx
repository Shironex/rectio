import type { Metadata } from 'next';

import { NotificationSettingsPage } from '@/components/settings/notification-settings-page';

export const metadata: Metadata = { title: 'Notification settings' };

export default function Page() {
  return <NotificationSettingsPage />;
}

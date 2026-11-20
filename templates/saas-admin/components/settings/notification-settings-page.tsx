'use client';

import { NotificationPreferences } from '@rectio/blocks/motion';
import { useState } from 'react';

import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_EVENTS,
  NOTIFICATION_RECOMMENDED,
} from '@/data/account';
import { SettingsFrame } from './settings-frame';

/** Which events reach you, and where. Saved as it changes; send each matrix to your API. */
export function NotificationSettingsPage() {
  const [value, setValue] = useState(NOTIFICATION_DEFAULTS);
  return (
    <SettingsFrame
      title="Notifications"
      description="Changes save as you make them. Security alerts always reach you by email."
    >
      <NotificationPreferences
        title="Delivery"
        description="Mobile push needs the Lindwell app signed in to this account."
        channels={NOTIFICATION_CHANNELS}
        events={NOTIFICATION_EVENTS}
        value={value}
        onChange={setValue}
        onUseRecommended={() => {
          setValue(NOTIFICATION_RECOMMENDED);
        }}
      />
    </SettingsFrame>
  );
}

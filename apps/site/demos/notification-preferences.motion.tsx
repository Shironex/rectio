'use client';

import { NotificationPreferences } from '@rectio/blocks/motion';
import { useState } from 'react';

import { CHANNELS, EVENTS, START } from './notification-preferences';

export default function NotificationPreferencesMotionDemo() {
  const [value, setValue] = useState(START);
  return (
    <div className="w-full">
      <NotificationPreferences
        channels={CHANNELS}
        events={EVENTS}
        value={value}
        onChange={setValue}
        onUseRecommended={() => {
          setValue(START);
        }}
      />
    </div>
  );
}

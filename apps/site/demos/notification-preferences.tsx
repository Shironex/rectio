'use client';

import {
  NotificationPreferences,
  type NotificationChannel,
  type NotificationEvent,
  type NotificationMatrix,
} from '@rectio/blocks';
import { useState } from 'react';

export const CHANNELS: NotificationChannel[] = [
  { id: 'email', label: 'Email' },
  { id: 'app', label: 'In app' },
  { id: 'push', label: 'Push' },
];

export const EVENTS: NotificationEvent[] = [
  {
    id: 'mention',
    group: 'Work',
    label: 'Mentions',
    description: 'Someone writes your name in a comment',
  },
  {
    id: 'assigned',
    group: 'Work',
    label: 'Assigned to you',
    description: 'A task or review lands on your desk',
  },
  {
    id: 'digest',
    group: 'Work',
    label: 'Weekly digest',
    description: 'What moved in your projects, on Mondays',
  },
  {
    id: 'invoice',
    group: 'Billing',
    label: 'Invoices',
    description: 'A new invoice or a failed payment',
  },
  {
    id: 'sign-in',
    group: 'Security',
    label: 'New sign in',
    description: 'From a device we have not seen before',
    required: ['email'],
  },
  {
    id: 'keys',
    group: 'Security',
    label: 'API key changes',
    description: 'A key is created or revoked',
    required: ['email'],
  },
];

export const START: NotificationMatrix = {
  mention: ['email', 'app', 'push'],
  assigned: ['app', 'push'],
  digest: ['email'],
  invoice: ['email'],
  'sign-in': ['email', 'push'],
  keys: ['email'],
};

export default function NotificationPreferencesDemo() {
  const [value, setValue] = useState(START);
  return (
    <div className="w-full">
      <NotificationPreferences
        channels={CHANNELS}
        events={EVENTS}
        value={value}
        onChange={setValue}
      />
    </div>
  );
}

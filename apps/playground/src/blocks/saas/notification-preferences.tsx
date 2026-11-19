import {
  NotificationPreferences as PlainNotificationPreferences,
  type NotificationChannel,
  type NotificationEvent,
  type NotificationMatrix,
} from '@rectio/blocks';
import { NotificationPreferences as MotionNotificationPreferences } from '@rectio/blocks/motion';
import { useState } from 'react';

import type { DemoProps } from './demo';

const CHANNELS: NotificationChannel[] = [
  { id: 'email', label: 'Email' },
  { id: 'app', label: 'In app' },
  { id: 'push', label: 'Push' },
];

const EVENTS: NotificationEvent[] = [
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
    id: 'usage',
    group: 'Billing',
    label: 'Usage alerts',
    description: 'At 80 and 100 per cent of an allowance',
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

const START: NotificationMatrix = {
  mention: ['email', 'app', 'push'],
  assigned: ['app', 'push'],
  digest: ['email'],
  invoice: ['email'],
  usage: ['email', 'app'],
  'sign-in': ['email', 'push'],
  keys: ['email'],
};

export function NotificationPreferencesDemo({ motion, empty }: DemoProps) {
  const NotificationPreferences = motion
    ? MotionNotificationPreferences
    : PlainNotificationPreferences;
  const [value, setValue] = useState<NotificationMatrix>(empty ? {} : START);
  return (
    <NotificationPreferences
      channels={CHANNELS}
      events={EVENTS}
      value={value}
      onChange={setValue}
    />
  );
}

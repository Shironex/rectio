import type { ActivityEvent } from '@rectio/blocks';

import { CURRENT_USER, TODAY, addDays, minutesAgo } from './workspace';

export type Range = '14d' | '30d';

export const RANGES: readonly { value: Range; label: string }[] = [
  { value: '14d', label: '14 days' },
  { value: '30d', label: '30 days' },
];

/** One day of ticket volume: how many came in and how many the team closed. */
export interface VolumeDay {
  date: Date;
  created: number;
  resolved: number;
}

// Weekdays are busy, weekends quiet, and a payments outage on 10 November spiked the queue.
const CREATED = [
  41, 38, 12, 9, 46, 44, 49, 40, 37, 11, 8, 43, 47, 45, 52, 39, 14, 10, 88, 61, 48, 42, 35, 13, 9,
  44, 41, 46, 39, 27,
];
const RESOLVED = [
  39, 40, 15, 10, 42, 45, 47, 43, 38, 12, 9, 40, 46, 47, 49, 41, 15, 12, 54, 70, 63, 47, 40, 16, 11,
  42, 43, 44, 41, 22,
];

/** The last 30 days, oldest first, ending today (a part day). */
export const VOLUME: readonly VolumeDay[] = CREATED.map((created, i) => ({
  date: addDays(TODAY, i - (CREATED.length - 1)),
  created,
  resolved: RESOLVED[i] ?? 0,
}));

export interface Figure {
  id: string;
  label: string;
  /** The figure, formatted. */
  value: string;
  unit?: string;
  change: { value: string; direction: 'up' | 'down' | 'flat'; favourable: boolean };
  description: string;
  /** Recent values, oldest first, drawn as a sparkline. */
  series: readonly number[];
}

/** The headline figures, for each range, against the range before it. */
export const FIGURES: Record<Range, readonly Figure[]> = {
  '14d': [
    {
      id: 'open',
      label: 'Open tickets',
      value: '12',
      change: { value: '5', direction: 'down', favourable: true },
      description: '1 past its first-response target',
      series: [17, 16, 18, 15, 16, 14, 15, 13, 14, 15, 13, 12, 13, 12],
    },
    {
      id: 'first-response',
      label: 'Median first response',
      value: '1h 12m',
      change: { value: '19m', direction: 'down', favourable: true },
      description: 'Target is 2 hours on business days',
      series: [96, 101, 92, 88, 94, 85, 83, 79, 81, 77, 75, 74, 73, 72],
    },
    {
      id: 'csat',
      label: 'Satisfaction',
      value: '94.2',
      unit: '%',
      change: { value: '1.4 pts', direction: 'up', favourable: true },
      description: '612 ratings from 1,118 surveys',
      series: [91, 92, 92.5, 91.8, 92.9, 93.1, 92.7, 93.4, 93.8, 93.6, 94, 94.4, 94.1, 94.2],
    },
    {
      id: 'resolved',
      label: 'Resolved',
      value: '541',
      change: { value: '8.2%', direction: 'up', favourable: true },
      description: '71% on the first reply',
      series: [39, 40, 15, 10, 42, 45, 47, 43, 38, 12, 9, 40, 46, 47],
    },
  ],
  '30d': [
    {
      id: 'open',
      label: 'Open tickets',
      value: '12',
      change: { value: '7', direction: 'down', favourable: true },
      description: '1 past its first-response target',
      series: [19, 18, 20, 17, 18, 21, 18, 16, 17, 15, 14, 14, 13, 12],
    },
    {
      id: 'first-response',
      label: 'Median first response',
      value: '1h 21m',
      change: { value: '7m', direction: 'up', favourable: false },
      description: 'Slowed by the outage on 10 November',
      series: [70, 74, 72, 78, 75, 73, 140, 118, 96, 88, 83, 79, 75, 72],
    },
    {
      id: 'csat',
      label: 'Satisfaction',
      value: '93.1',
      unit: '%',
      change: { value: '0.6 pts', direction: 'down', favourable: false },
      description: '1,304 ratings from 2,410 surveys',
      series: [94, 93.8, 94.1, 93.5, 93.9, 93.2, 89.4, 90.8, 91.9, 92.6, 93.4, 93.8, 94.1, 94.2],
    },
    {
      id: 'resolved',
      label: 'Resolved',
      value: '1,071',
      change: { value: '3.9%', direction: 'up', favourable: true },
      description: '68% on the first reply',
      series: [33, 36, 38, 35, 40, 41, 54, 70, 63, 47, 44, 42, 43, 44],
    },
  ],
};

/** What happened in the workspace lately, newest first. */
export const ACTIVITY: readonly ActivityEvent[] = [
  {
    id: 'a1',
    at: minutesAgo(4),
    actor: { name: 'Priya Natarajan' },
    kind: 'update',
    verb: 'moved',
    target: 'CPL-2141 QuickBooks sync stopped',
    change: { from: 'New', to: 'In progress' },
  },
  {
    id: 'a2',
    at: minutesAgo(18),
    actor: { name: 'Luis Ferreira' },
    kind: 'create',
    verb: 'opened',
    target: 'CPL-2147 Apple Pay payments fail at checkout',
    detail: 'Tern Bay Pools, by chat',
  },
  {
    id: 'a3',
    at: minutesAgo(41),
    actor: { name: CURRENT_USER.name },
    kind: 'comment',
    verb: 'commented on',
    target: 'CPL-2143 Recurring jobs skip the last Friday',
    detail: 'Engineering has a fix in review; I will call Erik at 2 pm.',
  },
  {
    id: 'a4',
    at: minutesAgo(65),
    actor: { name: 'Tomás Rivera' },
    kind: 'member',
    verb: 'invited',
    target: 'mateo.alvarez@copperline.app',
    detail: 'as a member',
  },
  {
    id: 'a5',
    at: minutesAgo(60 * 3),
    actor: { name: 'Lindwell', system: true },
    kind: 'security',
    verb: 'blocked a sign-in to',
    target: 'yuki@copperline.app',
    detail: 'from a new country, without two-factor',
  },
  {
    id: 'a6',
    at: minutesAgo(60 * 5),
    actor: { name: 'Sana Qureshi' },
    kind: 'update',
    verb: 'changed the plan of',
    target: 'Larkspur Cleaning Co.',
    change: { from: 'Starter', to: 'Team' },
  },
  {
    id: 'a7',
    at: minutesAgo(60 * 9),
    actor: { name: 'Lindwell', system: true },
    kind: 'update',
    verb: 'paused deliveries to',
    target: 'bi.copperline.app/ingest/csat',
    detail: 'after 5 failed attempts in a row',
  },
  {
    id: 'a8',
    at: minutesAgo(60 * 26),
    actor: { name: 'Kwame Asante' },
    kind: 'delete',
    verb: 'merged',
    target: '318 duplicate customers',
    detail: 'Saltmarsh Pest Control',
  },
];

/** Tickets past or near their first-response target, the queue a lead watches. */
export const AT_RISK: readonly {
  id: string;
  reference: string;
  title: string;
  customer: string;
  /** Minutes until the target, negative once it has passed. */
  remaining: number;
}[] = [
  {
    id: 'cpl-2135',
    reference: 'CPL-2135',
    title: 'Duplicate customers after CSV import',
    customer: 'Saltmarsh Pest Control',
    remaining: -96,
  },
  {
    id: 'cpl-2147',
    reference: 'CPL-2147',
    title: 'Apple Pay payments fail at checkout',
    customer: 'Tern Bay Pools',
    remaining: 12,
  },
  {
    id: 'cpl-2145',
    reference: 'CPL-2145',
    title: 'Booking page offers slots on Thanksgiving',
    customer: 'Larkspur Cleaning Co.',
    remaining: 24,
  },
  {
    id: 'cpl-2143',
    reference: 'CPL-2143',
    title: 'Recurring jobs skip the last Friday',
    customer: 'Halden Roofing',
    remaining: 58,
  },
];

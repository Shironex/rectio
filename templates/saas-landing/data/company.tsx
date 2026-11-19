import { ChatCircleTextIcon, EnvelopeSimpleIcon, MapPinIcon } from '@phosphor-icons/react';
import type { ContactChannel, TeamMember, TeamValue } from '@rectio/blocks/marketing';

import { SITE } from './site';

/** The company behind the product: people, values, openings, customers and releases. All invented. */

export const TEAM: readonly TeamMember[] = [
  {
    id: 'm1',
    name: 'Hanna Virtanen',
    role: 'Co-founder, CEO',
    bio: 'Ran rotas for a chain of forty cafés before writing the first version of Rostra.',
  },
  {
    id: 'm2',
    name: 'Daniel Osei',
    role: 'Co-founder, CTO',
    bio: 'Builds the scheduling engine and the rules that keep every rota legal.',
  },
  {
    id: 'm3',
    name: 'Jonas Adeyemi',
    role: 'Head of product',
    bio: 'Spends a day a month working shifts at a customer site.',
  },
  {
    id: 'm4',
    name: 'Mira Castellanos',
    role: 'Head of customer success',
    bio: 'Has helped more than nine hundred teams publish their first rota.',
  },
];

export const VALUES: readonly TeamValue[] = [
  {
    id: 'v1',
    title: 'Fair to the people on shift',
    description: 'Every feature is judged by what it does for the person working Saturday.',
  },
  {
    id: 'v2',
    title: 'Plain over clever',
    description: 'A rota should read at a glance on a small phone in a busy kitchen.',
  },
  {
    id: 'v3',
    title: 'Your data leaves with you',
    description: 'Full exports in open formats, on every plan, at any time.',
  },
];

export const OPENINGS = [
  { id: 'r1', title: 'Senior product engineer', team: 'Engineering', place: 'Remote, Europe' },
  { id: 'r2', title: 'Product designer, mobile', team: 'Design', place: 'Dublin or remote' },
  { id: 'r3', title: 'Customer success lead, Nordics', team: 'Customers', place: 'Stockholm' },
] as const;

export const CHANNELS: readonly ContactChannel[] = [
  {
    id: 'sales',
    label: 'Sales',
    value: SITE.email.sales,
    href: `mailto:${SITE.email.sales}`,
    icon: <EnvelopeSimpleIcon />,
  },
  {
    id: 'support',
    label: 'Support, weekdays 8 to 18 GMT',
    value: 'Chat in the app',
    icon: <ChatCircleTextIcon />,
  },
  {
    id: 'office',
    label: 'Office',
    value: '14 Grand Canal Quay, Dublin 2',
    icon: <MapPinIcon />,
  },
];

export const CONTACT_TOPICS = [
  { value: 'demo', label: 'A demo for my team' },
  { value: 'pricing', label: 'Plans and pricing' },
  { value: 'migration', label: 'Moving from another tool' },
  { value: 'other', label: 'Something else' },
] as const;

export interface CaseStudy {
  id: string;
  company: string;
  industry: string;
  metric: { value: string; label: string };
  summary: string;
  href: string;
}

export const CASE_STUDIES: readonly CaseStudy[] = [
  {
    id: 'harbour',
    company: 'Harbour Street',
    industry: 'Cafés, 2 sites',
    metric: { value: '4 days', label: 'earlier rota, every week' },
    summary: 'A Thursday routine that ended rota night for the manager.',
    href: '/blog/harbour-street-rota-by-thursday',
  },
  {
    id: 'linden',
    company: 'Linden Clinics',
    industry: 'Healthcare, 6 sites',
    metric: { value: '31%', label: 'fewer calls to the ward phone' },
    summary: 'Nurses see the whole week on their phones and swap without a call.',
    href: '/blog/open-shifts',
  },
  {
    id: 'northgate',
    company: 'Northgate Logistics',
    industry: 'Warehousing, 3 sites',
    metric: { value: '−19%', label: 'overtime in the first quarter' },
    summary: 'Rest and overtime checks caught the problems before payroll did.',
    href: '/blog/rest-rules-checklist',
  },
];

export type ReleaseKind = 'New' | 'Improved' | 'Fixed';

export interface Release {
  version: string;
  /** ISO date. */
  date: string;
  title: string;
  summary: string;
  changes: readonly { kind: ReleaseKind; text: string }[];
}

export const RELEASES: readonly Release[] = [
  {
    version: '4.6',
    date: '2026-11-12',
    title: 'Open shifts',
    summary: 'Post a gap once and the first qualified person to claim it gets it.',
    changes: [
      { kind: 'New', text: 'Open shift board on web and mobile, with pay rate per shift.' },
      { kind: 'New', text: 'Claim limits, so one person cannot take every extra shift.' },
      { kind: 'Improved', text: 'The coverage line now links each short day to its open shifts.' },
    ],
  },
  {
    version: '4.5',
    date: '2026-10-22',
    title: 'Weekend balance',
    summary: 'Everyone sees how their weekends compare over the last eight weeks.',
    changes: [
      { kind: 'New', text: 'Weekend balance on each profile and in the rota builder.' },
      { kind: 'Improved', text: 'Copying last week keeps approved time off in place.' },
      {
        kind: 'Fixed',
        text: 'Reminders for overnight shifts went out a day early in some time zones.',
      },
    ],
  },
  {
    version: '4.4',
    date: '2026-09-30',
    title: 'Rest rules',
    summary: 'Breaks, daily rest and weekly rest checked while you plan.',
    changes: [
      { kind: 'New', text: 'Rule sets per country and per contract, editable by admins.' },
      { kind: 'Improved', text: 'Overtime warnings show the hours that cause them.' },
    ],
  },
  {
    version: '4.3',
    date: '2026-09-09',
    title: 'Faster rota builder',
    summary: 'Large rotas open three times faster and drag without a stutter.',
    changes: [
      { kind: 'Improved', text: 'Rotas with over two hundred people load in under a second.' },
      { kind: 'Fixed', text: 'Dragging a shift onto a day off sometimes kept the old hours.' },
    ],
  },
];

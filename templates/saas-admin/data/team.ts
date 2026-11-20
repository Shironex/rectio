import type { PendingInvite, TeamMember, TeamRole } from '@rectio/blocks';

import { CURRENT_USER, at, minutesAgo } from './workspace';

/** A support agent: a team member with the queue they mostly work. */
export interface Agent extends TeamMember {
  queue: string;
}

/** The support team of the workspace, owner first. */
export const AGENTS: readonly Agent[] = [
  {
    id: CURRENT_USER.id,
    name: CURRENT_USER.name,
    email: CURRENT_USER.email,
    role: 'owner',
    lastActive: minutesAgo(1),
    you: true,
    queue: 'Escalations',
  },
  {
    id: 'u-tomas',
    name: 'Tomás Rivera',
    email: 'tomas@copperline.app',
    role: 'admin',
    lastActive: minutesAgo(6),
    queue: 'Billing',
  },
  {
    id: 'u-priya',
    name: 'Priya Natarajan',
    email: 'priya@copperline.app',
    role: 'member',
    lastActive: minutesAgo(14),
    queue: 'Integrations',
  },
  {
    id: 'u-kwame',
    name: 'Kwame Asante',
    email: 'kwame@copperline.app',
    role: 'member',
    lastActive: minutesAgo(38),
    queue: 'Scheduling',
  },
  {
    id: 'u-hannah',
    name: 'Hannah Becker',
    email: 'hannah@copperline.app',
    role: 'member',
    lastActive: minutesAgo(52),
    queue: 'Mobile app',
  },
  {
    id: 'u-leo',
    name: 'Leo Marchetti',
    email: 'leo@copperline.app',
    role: 'member',
    lastActive: minutesAgo(60 * 3 + 20),
    queue: 'Scheduling',
  },
  {
    id: 'u-sana',
    name: 'Sana Qureshi',
    email: 'sana@copperline.app',
    role: 'admin',
    lastActive: minutesAgo(60 * 20),
    queue: 'Onboarding',
  },
  {
    id: 'u-ruairi',
    name: 'Ruairí O’Connell',
    email: 'ruairi@copperline.app',
    role: 'member',
    lastActive: minutesAgo(60 * 26),
    queue: 'Billing',
  },
  {
    id: 'u-yuki',
    name: 'Yuki Tanaka',
    email: 'yuki@copperline.app',
    role: 'viewer',
    lastActive: minutesAgo(60 * 24 * 6),
    queue: 'Reporting',
  },
];

export const INVITES: readonly PendingInvite[] = [
  {
    id: 'inv-1',
    email: 'mateo.alvarez@copperline.app',
    role: 'member',
    invitedAt: at(11, 17, 15, 10),
    invitedBy: 'Tomás Rivera',
    expiresAt: at(11, 24, 15, 10),
  },
  {
    id: 'inv-2',
    email: 'freya.lund@copperline.app',
    role: 'member',
    invitedAt: at(11, 18, 9, 30),
    invitedBy: CURRENT_USER.name,
    expiresAt: at(11, 25, 9, 30),
  },
];

/** Seats on the Business plan; invites hold a seat. */
export const SEATS = 12;

export const CURRENT_ROLE: TeamRole = 'owner';

export function agentById(id: string): Agent | undefined {
  return AGENTS.find((agent) => agent.id === id);
}

/** What each role may do in the help desk, as the roles table on the team page shows it. */
export const PERMISSIONS: readonly {
  id: string;
  label: string;
  roles: Readonly<Record<TeamRole, boolean>>;
}[] = [
  {
    id: 'reply',
    label: 'Reply to and resolve tickets',
    roles: { owner: true, admin: true, member: true, viewer: false },
  },
  {
    id: 'customers',
    label: 'Edit customers and portal users',
    roles: { owner: true, admin: true, member: true, viewer: false },
  },
  {
    id: 'reports',
    label: 'See reports and CSAT',
    roles: { owner: true, admin: true, member: true, viewer: true },
  },
  {
    id: 'members',
    label: 'Invite and remove members',
    roles: { owner: true, admin: true, member: false, viewer: false },
  },
  {
    id: 'api',
    label: 'Create API keys and webhooks',
    roles: { owner: true, admin: true, member: false, viewer: false },
  },
  {
    id: 'billing',
    label: 'Change the plan and payment method',
    roles: { owner: true, admin: false, member: false, viewer: false },
  },
];

import {
  TeamMembers as PlainTeamMembers,
  type PendingInvite,
  type TeamMember,
  type TeamRole,
} from '@rectio/blocks';
import { TeamMembers as MotionTeamMembers } from '@rectio/blocks/motion';
import { useState } from 'react';

import { NOW, ago, type DemoProps } from './demo';

const MEMBERS: TeamMember[] = [
  {
    id: 'm1',
    name: 'Niamh Walsh',
    email: 'niamh@fernhill.io',
    role: 'owner',
    you: true,
    lastActive: ago(2),
  },
  {
    id: 'm2',
    name: 'Ines Duarte',
    email: 'ines.duarte@fernhill.io',
    role: 'admin',
    lastActive: ago(38),
  },
  {
    id: 'm3',
    name: 'Tomasz Wierzbicki',
    email: 'tomasz@fernhill.io',
    role: 'member',
    lastActive: ago(60 * 26),
  },
  {
    id: 'm4',
    name: 'Aiyana Brooks',
    email: 'aiyana.b@fernhill.io',
    role: 'member',
    lastActive: ago(60 * 5),
  },
  { id: 'm5', name: 'Kenji Arakawa', email: 'kenji@fernhill.io', role: 'viewer' },
];

const INVITES: PendingInvite[] = [
  {
    id: 'i1',
    email: 'margot.leclerc@fernhill.io',
    role: 'member',
    invitedAt: ago(60 * 50),
    invitedBy: 'Ines Duarte',
  },
  {
    id: 'i2',
    email: 'ravi@contractors.dev',
    role: 'viewer',
    invitedAt: ago(60 * 24 * 6),
    invitedBy: 'Niamh Walsh',
  },
];

export function TeamMembersDemo({ motion, empty, locale }: DemoProps) {
  const TeamMembers = motion ? MotionTeamMembers : PlainTeamMembers;
  const [members, setMembers] = useState(empty ? MEMBERS.slice(0, 1) : MEMBERS);
  const [invites, setInvites] = useState(empty ? [] : INVITES);
  return (
    <TeamMembers
      members={members}
      invites={invites}
      currentRole="owner"
      seats={10}
      now={NOW}
      locale={locale}
      onInvite={(emails, role: TeamRole) => {
        setInvites([
          ...invites,
          ...emails.map((email, index) => ({
            id: `n${String(Date.now() + index)}`,
            email,
            role,
            invitedAt: NOW,
            invitedBy: 'Niamh Walsh',
          })),
        ]);
      }}
      onChangeRole={(id, role) => {
        setMembers(members.map((m) => (m.id === id ? { ...m, role } : m)));
      }}
      onRemove={(id) => {
        setMembers(members.filter((m) => m.id !== id));
      }}
      onResendInvite={() => undefined}
      onRevokeInvite={(id) => {
        setInvites(invites.filter((i) => i.id !== id));
      }}
    />
  );
}

'use client';

import { TeamMembers, type PendingInvite, type TeamMember } from '@rectio/blocks';
import { useState } from 'react';

export const NOW = new Date(2026, 2, 19, 14, 20);
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

export const MEMBERS: TeamMember[] = [
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
    name: 'Callum Ross',
    email: 'callum@fernhill.io',
    role: 'member',
    lastActive: ago(1560),
  },
  { id: 'm4', name: 'Kenji Arakawa', email: 'kenji@fernhill.io', role: 'viewer' },
];

export const INVITES: PendingInvite[] = [
  {
    id: 'i1',
    email: 'margot.leclerc@fernhill.io',
    role: 'member',
    invitedAt: ago(3000),
    invitedBy: 'Ines Duarte',
  },
];

/** The app owns the team: here in state, in your app through your API. */
export default function TeamMembersDemo() {
  const [members, setMembers] = useState(MEMBERS);
  const [invites, setInvites] = useState(INVITES);
  return (
    <div className="w-full">
      <TeamMembers
        members={members}
        invites={invites}
        currentRole="owner"
        seats={8}
        now={NOW}
        locale="en-GB"
        onInvite={(emails, role) => {
          setInvites([
            ...invites,
            ...emails.map((email) => ({
              id: email,
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
        onResendInvite={(id) => {
          console.info('resend', id);
        }}
        onRevokeInvite={(id) => {
          setInvites(invites.filter((i) => i.id !== id));
        }}
      />
    </div>
  );
}

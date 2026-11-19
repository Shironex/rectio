'use client';

import { TeamMembers } from '@rectio/blocks/motion';
import { useState } from 'react';

import { INVITES, MEMBERS, NOW } from './team-members';

export default function TeamMembersMotionDemo() {
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
        onRevokeInvite={(id) => {
          setInvites(invites.filter((i) => i.id !== id));
        }}
      />
    </div>
  );
}

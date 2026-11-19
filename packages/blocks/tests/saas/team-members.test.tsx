import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  TeamMembers,
  assignableRoles,
  canManage,
  inviteError,
  parseInviteEmails,
  seatUsage,
  sortMembers,
  type PendingInvite,
  type TeamMember,
} from '../../src/index';

const NOW = new Date(2026, 2, 19, 14, 20);
const MEMBERS: TeamMember[] = [
  { id: 'a', name: 'Ines Duarte', email: 'ines@fernhill.io', role: 'admin' },
  { id: 'o', name: 'Niamh Walsh', email: 'niamh@fernhill.io', role: 'owner', you: true },
  { id: 'v', name: 'Kenji Arakawa', email: 'kenji@fernhill.io', role: 'viewer' },
];
const INVITES: PendingInvite[] = [
  { id: 'i', email: 'margot@fernhill.io', role: 'member', invitedAt: new Date(2026, 2, 17) },
];

describe('team rules', () => {
  it('lets owners hand out any role and admins up to admin', () => {
    expect(assignableRoles('owner')).toEqual(['owner', 'admin', 'member', 'viewer']);
    expect(assignableRoles('admin')).toEqual(['admin', 'member', 'viewer']);
    expect(assignableRoles('member')).toEqual([]);
  });

  it('never lets anyone change themselves, someone above them or the last owner', () => {
    const [admin, owner, viewer] = MEMBERS as [TeamMember, TeamMember, TeamMember];
    expect(canManage('owner', owner, MEMBERS)).toBe(false);
    expect(canManage('owner', admin, MEMBERS)).toBe(true);
    expect(canManage('admin', viewer, MEMBERS)).toBe(true);
    expect(canManage('member', viewer, MEMBERS)).toBe(false);
    const otherOwner = { ...owner, you: false };
    expect(canManage('owner', otherOwner, [otherOwner])).toBe(false);
  });

  it('sorts pasted addresses into valid, invalid and already there', () => {
    const parse = parseInviteEmails(
      'a@x.io, B@x.io;niamh@fernhill.io margot@fernhill.io nope a@x.io',
      MEMBERS,
      INVITES,
    );
    expect(parse).toEqual({
      valid: ['a@x.io', 'b@x.io'],
      invalid: ['nope'],
      existing: ['niamh@fernhill.io', 'margot@fernhill.io'],
    });
    expect(inviteError(parse, null)).toBe('Check this address: nope.');
    expect(inviteError({ valid: ['a@x.io', 'b@x.io'], invalid: [], existing: [] }, 1)).toBe(
      'Only 1 seat is left on your plan.',
    );
    expect(inviteError({ valid: [], invalid: [], existing: [] }, null)).toBe(
      'Enter at least one email address.',
    );
  });

  it('counts pending invites as seats and sorts you first, then by role', () => {
    expect(seatUsage(MEMBERS, INVITES, 5)).toEqual({ used: 4, total: 5, left: 1 });
    expect(seatUsage(MEMBERS, INVITES)).toEqual({ used: 4, total: null, left: null });
    expect(sortMembers(MEMBERS).map((m) => m.id)).toEqual(['o', 'a', 'v']);
  });
});

describe('TeamMembers', () => {
  it('invites valid addresses with the chosen role', async () => {
    const onInvite = vi.fn();
    render(
      <TeamMembers
        members={MEMBERS}
        invites={INVITES}
        currentRole="owner"
        now={NOW}
        locale="en-GB"
        onInvite={onInvite}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Invite people' }));
    await userEvent.type(screen.getByLabelText('Email addresses'), 'sam@x.io, lee@x.io');
    await userEvent.click(screen.getByRole('button', { name: 'Send 2 invites' }));
    expect(onInvite).toHaveBeenCalledWith(['sam@x.io', 'lee@x.io'], 'member');
  });

  it('puts the one invite button inside the empty state when you are alone', async () => {
    render(
      <TeamMembers
        members={MEMBERS.filter((member) => member.you === true)}
        invites={[]}
        currentRole="owner"
        now={NOW}
        locale="en-GB"
        onInvite={vi.fn()}
      />,
    );
    expect(screen.getByText('It is just you so far')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Invite people' })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Invite people' }));
    expect(screen.getByLabelText('Email addresses')).toBeInTheDocument();
    expect(screen.queryByText('It is just you so far')).not.toBeInTheDocument();
    // Cancelling brings the empty state back and hands focus to its invite button.
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Invite people' })).toHaveFocus();
    });
  });

  it('refuses an invite with a bad address and says which', async () => {
    const onInvite = vi.fn();
    render(<TeamMembers members={MEMBERS} currentRole="owner" now={NOW} onInvite={onInvite} />);
    await userEvent.click(screen.getByRole('button', { name: 'Invite people' }));
    await userEvent.type(screen.getByLabelText('Email addresses'), 'sam@');
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(onInvite).not.toHaveBeenCalled();
    expect(screen.getByText('Check this address: sam@.')).toBeInTheDocument();
  });

  it('confirms before removing someone', async () => {
    const onRemove = vi.fn();
    render(<TeamMembers members={MEMBERS} currentRole="owner" now={NOW} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Kenji Arakawa' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove from team' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Remove Kenji Arakawa?')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove from team' }));
    expect(onRemove).toHaveBeenCalledWith('v');
  });

  it('offers members no management', () => {
    render(
      <TeamMembers
        members={MEMBERS}
        currentRole="member"
        now={NOW}
        onInvite={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Invite people' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Actions for/ })).not.toBeInTheDocument();
  });

  it('revokes a pending invite', async () => {
    const onRevokeInvite = vi.fn();
    render(
      <TeamMembers
        members={MEMBERS}
        invites={INVITES}
        currentRole="owner"
        now={NOW}
        onRevokeInvite={onRevokeInvite}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Revoke invite to margot@fernhill.io' }),
    );
    expect(onRevokeInvite).toHaveBeenCalledWith('i');
  });
});

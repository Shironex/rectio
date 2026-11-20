import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import {
  ApiKeys,
  CommentThread,
  FileManager,
  TeamMembers,
  UsersTable,
  type ApiKey,
  type CommentAuthor,
  type FileEntry,
  type PendingInvite,
  type TeamMember,
  type ThreadComment,
  type UserRecord,
} from '../../src/index';

const NOW = new Date(2026, 2, 19, 14, 20);

/** Names of the row menus, top to bottom. */
const menus = () =>
  screen
    .getAllByRole('button', { name: /^Actions for / })
    .map((button) => button.getAttribute('aria-label'));

async function confirmIn(name: string) {
  const dialog = await screen.findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('button', { name }));
}

describe('focus after a delete', () => {
  const MEMBERS: TeamMember[] = [
    { id: 'o', name: 'Niamh Walsh', email: 'niamh@fernhill.io', role: 'owner', you: true },
    { id: 'a', name: 'Ines Duarte', email: 'ines@fernhill.io', role: 'admin' },
    { id: 'v', name: 'Kenji Arakawa', email: 'kenji@fernhill.io', role: 'viewer' },
  ];
  const INVITES: PendingInvite[] = [
    { id: 'i', email: 'margot@fernhill.io', role: 'member', invitedAt: new Date(2026, 2, 17) },
  ];
  function Team() {
    const [members, setMembers] = useState(MEMBERS);
    const [invites, setInvites] = useState(INVITES);
    return (
      <TeamMembers
        members={members}
        invites={invites}
        currentRole="owner"
        now={NOW}
        onRemove={(id) => {
          setMembers((list) => list.filter((m) => m.id !== id));
        }}
        onRevokeInvite={(id) => {
          setInvites((list) => list.filter((i) => i.id !== id));
        }}
      />
    );
  }

  it('moves to the next member once someone is removed', async () => {
    render(<Team />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Ines Duarte' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove from team' }));
    await confirmIn('Remove from team');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Actions for Kenji Arakawa' })).toHaveFocus();
    });
  });

  it('moves to the row before when the last invite is revoked', async () => {
    render(<Team />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Revoke invite to margot@fernhill.io' }),
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Actions for Kenji Arakawa' })).toHaveFocus();
    });
  });

  it('lands on the next active key after a revoke', async () => {
    const keys: ApiKey[] = [
      {
        id: 'a',
        name: 'Billing worker',
        prefix: 'fh_a',
        scope: 'write',
        createdAt: new Date(2026, 2, 2),
      },
      { id: 'b', name: 'Sync', prefix: 'fh_b', scope: 'read', createdAt: new Date(2026, 1, 2) },
    ];
    function Keys() {
      const [list, setList] = useState(keys);
      return (
        <ApiKeys
          keys={list}
          scopes={[
            { value: 'read', label: 'Read only' },
            { value: 'write', label: 'Read and write' },
          ]}
          now={NOW}
          onRevoke={(id) => {
            setList((all) => all.map((k) => (k.id === id ? { ...k, revokedAt: NOW } : k)));
          }}
        />
      );
    }
    render(<Keys />);
    await userEvent.click(screen.getByRole('button', { name: 'Revoke, Billing worker' }));
    await confirmIn('Revoke key');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Revoke, Sync' })).toHaveFocus();
    });
  });

  it('falls back to the heading when the last comment is deleted', async () => {
    const me: CommentAuthor = { id: 'me', name: 'Niamh Walsh' };
    function Thread() {
      const [comments, setComments] = useState<ThreadComment[]>([
        { id: 'c1', author: me, body: 'Only one', createdAt: NOW },
      ]);
      return (
        <CommentThread
          comments={comments}
          writer={me}
          now={NOW}
          onAdd={() => undefined}
          onDelete={(id) => {
            setComments((list) => list.filter((c) => c.id !== id));
          }}
        />
      );
    }
    render(<Thread />);
    await userEvent.click(screen.getByRole('button', { name: /^Actions for/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await confirmIn('Delete comment');
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveFocus();
    });
  });

  it('moves to the next file once one is deleted', async () => {
    const entries: FileEntry[] = [
      { id: 'a', name: 'a.pdf', type: 'file', size: 1, modified: NOW },
      { id: 'b', name: 'b.pdf', type: 'file', size: 1, modified: NOW },
      { id: 'c', name: 'c.pdf', type: 'file', size: 1, modified: NOW },
    ];
    function Files() {
      const [list, setList] = useState(entries);
      return (
        <FileManager
          path={[{ id: 'root', name: 'Files' }]}
          entries={list}
          now={NOW}
          onDelete={(ids) => {
            setList((all) => all.filter((e) => !ids.includes(e.id)));
          }}
        />
      );
    }
    render(<Files />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions for b.pdf' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await confirmIn('Delete');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Actions for c.pdf' })).toHaveFocus();
    });
  });

  it('moves to the next user on the page once one is removed', async () => {
    const users: UserRecord[] = [
      { id: 'o', name: 'Niamh Walsh', email: 'niamh@x.io', role: 'owner', status: 'active' },
      { id: 'a', name: 'Ines Duarte', email: 'ines@x.io', role: 'admin', status: 'active' },
      {
        id: 'm',
        name: 'Tomasz Wierzbicki',
        email: 'tomasz@x.io',
        role: 'member',
        status: 'active',
      },
      { id: 'g', name: 'Kenji Arakawa', email: 'kenji@x.io', role: 'guest', status: 'invited' },
    ];
    function Users() {
      const [list, setList] = useState(users);
      return (
        <UsersTable
          users={list}
          now={NOW}
          onRemove={(ids) => {
            setList((all) => all.filter((u) => !ids.includes(u.id)));
          }}
        />
      );
    }
    render(<Users />);
    const before = menus();
    const target = before[0] ?? '';
    const next = before[1] ?? '';
    await userEvent.click(screen.getByRole('button', { name: target }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove user' }));
    await confirmIn('Remove user');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: next })).toHaveFocus();
    });
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  EMPTY_USER_FILTERS,
  UsersTable,
  bulkUserTargets,
  filterUsers,
  userCounts,
  userFiltersActive,
  type UserRecord,
} from '../../src/index';

const NOW = new Date(2026, 2, 19, 14, 20);
const USERS: UserRecord[] = [
  {
    id: 'o',
    name: 'Niamh Walsh',
    email: 'niamh@fernhill.io',
    role: 'owner',
    status: 'active',
    team: 'Leadership',
  },
  {
    id: 'a',
    name: 'Inês Duarte',
    email: 'ines@fernhill.io',
    role: 'admin',
    status: 'active',
    team: 'Operations',
  },
  {
    id: 'm',
    name: 'Tomasz Wierzbicki',
    email: 'tomasz@fernhill.io',
    role: 'member',
    status: 'suspended',
    team: 'Engineering',
  },
  { id: 'g', name: 'Kenji Arakawa', email: 'kenji@fernhill.io', role: 'guest', status: 'invited' },
];

describe('users table logic', () => {
  it('searches name, email and team, ignoring case and accents', () => {
    expect(filterUsers(USERS, { ...EMPTY_USER_FILTERS, query: 'ines' }).map((u) => u.id)).toEqual([
      'a',
    ]);
    expect(
      filterUsers(USERS, { ...EMPTY_USER_FILTERS, query: 'ENGINEERING tomasz' }).map((u) => u.id),
    ).toEqual(['m']);
    expect(
      filterUsers(USERS, { query: '', role: 'guest', status: 'invited' }).map((u) => u.id),
    ).toEqual(['g']);
    expect(filterUsers(USERS, { query: '', role: 'admin', status: 'suspended' })).toEqual([]);
  });

  it('knows when filters are on and counts each role and status', () => {
    expect(userFiltersActive(EMPTY_USER_FILTERS)).toBe(false);
    expect(userFiltersActive({ ...EMPTY_USER_FILTERS, query: '  ' })).toBe(false);
    expect(userFiltersActive({ ...EMPTY_USER_FILTERS, role: 'admin' })).toBe(true);
    const counts = userCounts(USERS);
    expect(counts.roles).toEqual({ all: 4, owner: 1, admin: 1, member: 1, guest: 1 });
    expect(counts.statuses).toEqual({ all: 4, active: 2, invited: 1, suspended: 1 });
  });

  it('leaves owners out of bulk changes', () => {
    expect(bulkUserTargets(USERS, ['o', 'a', 'g'])).toEqual({ ids: ['a', 'g'], skippedOwners: 1 });
  });
});

describe('UsersTable', () => {
  it('filters by search and offers to clear when nothing matches', async () => {
    render(<UsersTable users={USERS} now={NOW} locale="en-GB" />);
    const search = screen.getByRole('searchbox', { name: 'Search users' });
    await userEvent.type(search, 'zzz');
    expect(screen.getByText('No users match')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(search).toHaveValue('');
    expect(screen.getByText('Kenji Arakawa')).toBeInTheDocument();
  });

  it('suspends the selected users from the bulk bar', async () => {
    const onSuspend = vi.fn();
    render(<UsersTable users={USERS} now={NOW} onSuspend={onSuspend} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Inês Duarte' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Kenji Arakawa' }));
    const bar = screen.getByRole('region', { name: 'Bulk actions' });
    expect(bar).toHaveTextContent('2 selected');
    await userEvent.click(within(bar).getByRole('button', { name: 'Suspend' }));
    expect(onSuspend).toHaveBeenCalledWith(['a', 'g']);
    expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument();
  });

  it('confirms before removing a user from the row menu', async () => {
    const onRemove = vi.fn();
    render(<UsersTable users={USERS} now={NOW} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Kenji Arakawa' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove user' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Remove Kenji Arakawa?')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove user' }));
    expect(onRemove).toHaveBeenCalledWith(['g']);
  });

  it('gives owners no row menu and no checkbox to tick', () => {
    render(<UsersTable users={USERS} now={NOW} onRemove={vi.fn()} />);
    expect(
      screen.queryByRole('button', { name: 'Actions for Niamh Walsh' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Select Niamh Walsh' })).not.toBeInTheDocument();
    expect(
      screen.getByText('Niamh Walsh is an owner and is left out of bulk changes'),
    ).toBeInTheDocument();
  });

  it('shows an empty state with no users', () => {
    render(<UsersTable users={[]} now={NOW} />);
    expect(screen.getByRole('status')).toHaveTextContent('Bring your team in');
  });
});

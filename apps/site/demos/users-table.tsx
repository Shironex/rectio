'use client';

import { type UserRecord, UsersTable, type UsersTableProps } from '@rectio/blocks';
import { useState } from 'react';

export const NOW = new Date(2026, 2, 19, 14, 20);
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

const USERS: UserRecord[] = [
  {
    id: 'u01',
    name: 'Niamh Walsh',
    email: 'niamh@fernhill.io',
    role: 'owner',
    status: 'active',
    team: 'Leadership',
    lastSeen: ago(2),
  },
  {
    id: 'u02',
    name: 'Ines Duarte',
    email: 'ines.duarte@fernhill.io',
    role: 'admin',
    status: 'active',
    team: 'Operations',
    lastSeen: ago(38),
  },
  {
    id: 'u03',
    name: 'Tomasz Wierzbicki',
    email: 'tomasz@fernhill.io',
    role: 'member',
    status: 'active',
    team: 'Engineering',
    lastSeen: ago(60 * 26),
  },
  {
    id: 'u04',
    name: 'Aiyana Brooks',
    email: 'aiyana.b@fernhill.io',
    role: 'member',
    status: 'active',
    team: 'Design',
    lastSeen: ago(60 * 5),
  },
  {
    id: 'u05',
    name: 'Kenji Arakawa',
    email: 'kenji@fernhill.io',
    role: 'guest',
    status: 'invited',
    team: 'Finance',
  },
  {
    id: 'u06',
    name: 'Margot Leclerc',
    email: 'margot.leclerc@fernhill.io',
    role: 'member',
    status: 'suspended',
    team: 'Sales',
    lastSeen: ago(60 * 24 * 41),
  },
  {
    id: 'u07',
    name: 'Oluwaseun Adeyemi',
    email: 'seun@fernhill.io',
    role: 'admin',
    status: 'active',
    team: 'Engineering',
    lastSeen: ago(12),
  },
  {
    id: 'u08',
    name: 'Rasmus Lindqvist',
    email: 'rasmus@fernhill.io',
    role: 'member',
    status: 'active',
    team: 'Support',
    lastSeen: ago(60 * 3),
  },
  {
    id: 'u09',
    name: 'Priya Raman',
    email: 'priya.raman@fernhill.io',
    role: 'member',
    status: 'active',
    team: 'Engineering',
    lastSeen: ago(60 * 24 * 2),
  },
  {
    id: 'u10',
    name: 'Joaquín Herrera',
    email: 'joaquin@fernhill.io',
    role: 'guest',
    status: 'active',
    team: 'Legal',
    lastSeen: ago(60 * 24 * 9),
  },
  {
    id: 'u11',
    name: 'Hannah Okafor',
    email: 'hannah.o@fernhill.io',
    role: 'member',
    status: 'invited',
    team: 'Design',
  },
  {
    id: 'u12',
    name: 'Eliška Novotná',
    email: 'eliska@fernhill.io',
    role: 'member',
    status: 'active',
    team: 'Operations',
    lastSeen: ago(55),
  },
];

/** The demo's props: the app owns the data, here in state, in your app through your API. */
export function useUsersTableDemo() {
  const [users, setUsers] = useState(USERS);
  const update = (ids: string[], change: Partial<UserRecord>) => {
    setUsers(users.map((user) => (ids.includes(user.id) ? { ...user, ...change } : user)));
  };
  const props: UsersTableProps = {
    users,
    now: NOW,
    locale: 'en-GB',
    pageSize: 8,
    onInvite: () => undefined,
    onOpenUser: () => undefined,
    onChangeRole: (ids, role) => {
      update(ids, { role });
    },
    onSuspend: (ids) => {
      update(ids, { status: 'suspended' });
    },
    onReactivate: (ids) => {
      update(ids, { status: 'active' });
    },
    onRemove: (ids) => {
      setUsers(users.filter((user) => !ids.includes(user.id)));
    },
  };
  return props;
}

export default function UsersTableDemo() {
  const props = useUsersTableDemo();
  return (
    <div className="w-full">
      <UsersTable {...props} />
    </div>
  );
}

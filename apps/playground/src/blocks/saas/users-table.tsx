import { UsersTable as PlainUsersTable, type UserRecord } from '@rectio/blocks';
import { UsersTable as MotionUsersTable } from '@rectio/blocks/motion';
import { useState } from 'react';

import { NOW, ago, type DemoProps } from './demo';

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

export function UsersTableDemo({ motion, empty, locale }: DemoProps) {
  const UsersTable = motion ? MotionUsersTable : PlainUsersTable;
  const [users, setUsers] = useState(empty ? [] : USERS);
  const update = (ids: string[], change: Partial<UserRecord>) => {
    setUsers(users.map((user) => (ids.includes(user.id) ? { ...user, ...change } : user)));
  };
  return (
    <UsersTable
      users={users}
      now={NOW}
      locale={locale}
      pageSize={8}
      onInvite={() => undefined}
      onOpenUser={() => undefined}
      onChangeRole={(ids, role) => {
        update(ids, { role });
      }}
      onSuspend={(ids) => {
        update(ids, { status: 'suspended' });
      }}
      onReactivate={(ids) => {
        update(ids, { status: 'active' });
      }}
      onRemove={(ids) => {
        setUsers(users.filter((user) => !ids.includes(user.id)));
      }}
    />
  );
}

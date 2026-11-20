export type Role = 'owner' | 'admin' | 'approver' | 'member';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  team: string;
  /** Invited but not signed in yet. */
  invited?: boolean;
}

export const ROLES: readonly { value: Role; label: string; description: string }[] = [
  { value: 'owner', label: 'Owner', description: 'Billing, members and everything else.' },
  { value: 'admin', label: 'Admin', description: 'Settings, members and the books.' },
  { value: 'approver', label: 'Approver', description: 'Decides expenses and bills.' },
  { value: 'member', label: 'Member', description: 'Submits expenses, sees their own.' },
];

export const TEAM: readonly TeamMember[] = [
  {
    id: 'u1',
    name: 'Niamh Walsh',
    email: 'niamh.walsh@fernhill.ie',
    role: 'owner',
    team: 'Finance',
  },
  {
    id: 'u2',
    name: 'Rory Quinn',
    email: 'rory.quinn@fernhill.ie',
    role: 'admin',
    team: 'Finance',
  },
  {
    id: 'u3',
    name: 'Clara Hughes',
    email: 'clara.hughes@fernhill.ie',
    role: 'approver',
    team: 'Customer success',
  },
  { id: 'u4', name: 'Tom Avery', email: 'tom.avery@fernhill.ie', role: 'member', team: 'Sales' },
  {
    id: 'u5',
    name: 'Aoife Byrne',
    email: 'aoife.byrne@fernhill.ie',
    role: 'member',
    team: 'Sales',
  },
  {
    id: 'u6',
    name: 'Jonas Berg',
    email: 'jonas.berg@fernhill.ie',
    role: 'member',
    team: 'Engineering',
  },
  {
    id: 'u7',
    name: 'Sofia Lindqvist',
    email: 'sofia.lindqvist@fernhill.ie',
    role: 'approver',
    team: 'Engineering',
  },
  {
    id: 'u8',
    name: 'Cian Doherty',
    email: 'cian.doherty@fernhill.ie',
    role: 'member',
    team: 'Customer success',
    invited: true,
  },
];

export type UserRole = 'owner' | 'admin' | 'member' | 'guest';
export type UserStatus = 'active' | 'invited' | 'suspended';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  /** Last seen in the app; omitted for someone who never signed in. */
  lastSeen?: Date;
  /** Team or department, shown under the name on wide tables. */
  team?: string;
}

export const USER_ROLES: readonly UserRole[] = ['owner', 'admin', 'member', 'guest'];
export const USER_STATUSES: readonly UserStatus[] = ['active', 'invited', 'suspended'];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  guest: 'Guest',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Active',
  invited: 'Invited',
  suspended: 'Suspended',
};

export interface UserFilters {
  /** Matched against name, email and team, ignoring case and accents. */
  query: string;
  role: UserRole | 'all';
  status: UserStatus | 'all';
}

export const EMPTY_USER_FILTERS: UserFilters = { query: '', role: 'all', status: 'all' };

/** Lower case without accents, so "inês" finds "Ines" and "INES" alike. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** True when the user matches every filter; words of the query may match different fields. */
export function matchesUserFilters(user: UserRecord, filters: UserFilters): boolean {
  if (filters.role !== 'all' && user.role !== filters.role) return false;
  if (filters.status !== 'all' && user.status !== filters.status) return false;
  const words = fold(filters.query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fold(`${user.name} ${user.email} ${user.team ?? ''}`);
  return words.every((word) => haystack.includes(word));
}

export function filterUsers(users: readonly UserRecord[], filters: UserFilters): UserRecord[] {
  return users.filter((user) => matchesUserFilters(user, filters));
}

/** True when any filter narrows the list, so the empty table can offer to clear them. */
export function userFiltersActive(filters: UserFilters): boolean {
  return filters.query.trim() !== '' || filters.role !== 'all' || filters.status !== 'all';
}

/** How many users each role and status holds, for the counts beside the filters. */
export function userCounts(users: readonly UserRecord[]): {
  roles: Record<UserRole | 'all', number>;
  statuses: Record<UserStatus | 'all', number>;
} {
  const roles: Record<UserRole | 'all', number> = {
    all: users.length,
    owner: 0,
    admin: 0,
    member: 0,
    guest: 0,
  };
  const statuses: Record<UserStatus | 'all', number> = {
    all: users.length,
    active: 0,
    invited: 0,
    suspended: 0,
  };
  for (const user of users) {
    roles[user.role] += 1;
    statuses[user.status] += 1;
  }
  return { roles, statuses };
}

/**
 * The ids a bulk action may touch: owners are never changed, suspended or removed in bulk, so a
 * select-all can never lock the workspace out of its owners. Returns the rest and how many were held.
 */
export function bulkUserTargets(
  users: readonly UserRecord[],
  ids: readonly string[],
): { ids: string[]; skippedOwners: number } {
  const wanted = new Set(ids);
  const chosen = users.filter((user) => wanted.has(user.id));
  return {
    ids: chosen.filter((user) => user.role !== 'owner').map((user) => user.id),
    skippedOwners: chosen.filter((user) => user.role === 'owner').length,
  };
}

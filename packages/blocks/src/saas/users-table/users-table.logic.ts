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
  /** Marks the signed-in user, from your session: their own row gets no actions. */
  you?: boolean;
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

/** What a search looks through for one user: name, email and team, folded. */
export function userHaystack(user: UserRecord): string {
  return fold(`${user.name} ${user.email} ${user.team ?? ''}`);
}

/** Every user's folded search text, worked out once per list instead of once per keystroke. */
export function userHaystacks(users: readonly UserRecord[]): Map<string, string> {
  return new Map(users.map((user) => [user.id, userHaystack(user)]));
}

/** True when the user matches every filter; words of the query may match different fields. */
export function matchesUserFilters(
  user: UserRecord,
  filters: UserFilters,
  haystack: string = userHaystack(user),
): boolean {
  if (filters.role !== 'all' && user.role !== filters.role) return false;
  if (filters.status !== 'all' && user.status !== filters.status) return false;
  const words = fold(filters.query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  return words.every((word) => haystack.includes(word));
}

/** The users that match; pass `haystacks` from `userHaystacks` to skip folding on every call. */
export function filterUsers(
  users: readonly UserRecord[],
  filters: UserFilters,
  haystacks?: ReadonlyMap<string, string>,
): UserRecord[] {
  return users.filter((user) => matchesUserFilters(user, filters, haystacks?.get(user.id)));
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
 * Who is looking at the table, from your session: their role decides which rows they may act on.
 * Leave it out and only the owner rule applies; mark their own record with `you`.
 */
export interface UsersTableViewer {
  role?: UserRole | undefined;
}

const USER_RANK: Record<UserRole, number> = { owner: 3, admin: 2, member: 1, guest: 0 };

/** The roles the person looking may hand out: never owner, and nothing above their own role. */
export function assignableUserRoles(viewer: UsersTableViewer = {}): UserRole[] {
  const ceiling = viewer.role === undefined ? USER_RANK.admin : USER_RANK[viewer.role];
  if (viewer.role === 'member' || viewer.role === 'guest') return [];
  return USER_ROLES.filter((role) => role !== 'owner' && USER_RANK[role] <= ceiling);
}

/**
 * Whether the person looking may change, suspend or remove `target`: never an owner, never
 * themselves, and never someone above their own role. Members and guests manage no one.
 */
export function canActOnUser(target: UserRecord, viewer: UsersTableViewer = {}): boolean {
  if (target.role === 'owner') return false;
  if (target.you === true) return false;
  if (viewer.role === undefined) return true;
  if (assignableUserRoles(viewer).length === 0) return false;
  return USER_RANK[target.role] <= USER_RANK[viewer.role];
}

/**
 * The ids a bulk action may touch: owners are never changed, suspended or removed in bulk, so a
 * select-all can never lock the workspace out of its owners; with a `viewer`, neither are they
 * themselves nor anyone above their role. Returns the rest and how many were held.
 */
export function bulkUserTargets(
  users: readonly UserRecord[],
  ids: readonly string[],
  viewer: UsersTableViewer = {},
): { ids: string[]; skippedOwners: number; skipped: number } {
  const wanted = new Set(ids);
  const chosen = users.filter((user) => wanted.has(user.id));
  const allowed = chosen.filter((user) => canActOnUser(user, viewer));
  return {
    ids: allowed.map((user) => user.id),
    skippedOwners: chosen.filter((user) => user.role === 'owner').length,
    skipped: chosen.length - allowed.length,
  };
}

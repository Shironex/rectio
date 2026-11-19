import { isEmail } from '../lib/saas';

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatarUrl?: string;
  /** Last seen in the app; omitted for someone who never signed in. */
  lastActive?: Date;
  /** The person looking at the block. */
  you?: boolean;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: TeamRole;
  invitedAt: Date;
  invitedBy?: string;
  expiresAt?: Date;
}

export const ROLES: readonly TeamRole[] = ['owner', 'admin', 'member', 'viewer'];

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export const ROLE_HINTS: Record<TeamRole, string> = {
  owner: 'Billing, deleting the workspace and everything below',
  admin: 'Members, settings and integrations',
  member: 'Create and edit work',
  viewer: 'Read only',
};

const RANK: Record<TeamRole, number> = { owner: 3, admin: 2, member: 1, viewer: 0 };

/** The roles someone may hand out: owners any, admins up to admin, others none. */
export function assignableRoles(actor: TeamRole): TeamRole[] {
  if (actor === 'owner') return [...ROLES];
  if (actor === 'admin') return ROLES.filter((role) => RANK[role] <= RANK.admin);
  return [];
}

/**
 * Whether `actor` may change or remove `target`: never themselves, never someone above them, and
 * never the last owner, so a workspace always keeps one.
 */
export function canManage(
  actor: TeamRole,
  target: TeamMember,
  members: readonly TeamMember[],
): boolean {
  if (target.you === true) return false;
  if (assignableRoles(actor).length === 0) return false;
  if (RANK[target.role] > RANK[actor]) return false;
  if (target.role === 'owner' && actor !== 'owner') return false;
  if (target.role === 'owner' && members.filter((m) => m.role === 'owner').length <= 1)
    return false;
  return true;
}

export interface InviteParse {
  valid: string[];
  invalid: string[];
  /** Already a member or already invited. */
  existing: string[];
}

/** Splits pasted addresses on commas, semicolons, spaces or new lines, and sorts them out. */
export function parseInviteEmails(
  text: string,
  members: readonly TeamMember[],
  invites: readonly PendingInvite[],
): InviteParse {
  const taken = new Set(
    [...members.map((m) => m.email), ...invites.map((i) => i.email)].map((e) => e.toLowerCase()),
  );
  const seen = new Set<string>();
  const result: InviteParse = { valid: [], invalid: [], existing: [] };
  for (const raw of text.split(/[\s,;]+/)) {
    const email = raw.trim().toLowerCase();
    if (email === '' || seen.has(email)) continue;
    seen.add(email);
    if (!isEmail(email)) result.invalid.push(raw.trim());
    else if (taken.has(email)) result.existing.push(email);
    else result.valid.push(email);
  }
  return result;
}

/** The first problem with an invite, in words, or null when it can be sent. */
export function inviteError(parse: InviteParse, seatsLeft: number | null): string | null {
  if (parse.invalid.length > 0) {
    return `Check ${parse.invalid.length === 1 ? 'this address' : 'these addresses'}: ${parse.invalid.join(', ')}.`;
  }
  if (parse.valid.length === 0 && parse.existing.length > 0) {
    return `${parse.existing.join(', ')} ${parse.existing.length === 1 ? 'is' : 'are'} already on the team or invited.`;
  }
  if (parse.valid.length === 0) return 'Enter at least one email address.';
  if (seatsLeft !== null && parse.valid.length > seatsLeft) {
    return `Only ${String(seatsLeft)} ${seatsLeft === 1 ? 'seat is' : 'seats are'} left on your plan.`;
  }
  return null;
}

export interface SeatUsage {
  used: number;
  /** Null when the plan has no seat limit. */
  total: number | null;
  left: number | null;
}

/** Seats are taken by members and by invites still pending. */
export function seatUsage(
  members: readonly TeamMember[],
  invites: readonly PendingInvite[],
  seats?: number,
): SeatUsage {
  const used = members.length + invites.length;
  if (seats === undefined) return { used, total: null, left: null };
  return { used, total: seats, left: Math.max(0, seats - used) };
}

/** Members in the order a team page reads: you first, then by role, then by name. */
export function sortMembers(members: readonly TeamMember[]): TeamMember[] {
  return [...members].sort(
    (a, b) =>
      Number(b.you === true) - Number(a.you === true) ||
      RANK[b.role] - RANK[a.role] ||
      a.name.localeCompare(b.name),
  );
}

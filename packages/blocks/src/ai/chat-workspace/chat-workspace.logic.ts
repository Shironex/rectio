/** One conversation in the workspace's list, as the app's own store holds it. */
export interface AiChatSummary {
  id: string;
  /** The name in the list; an empty one shows the untitled words. */
  title: string;
  /** When it last changed, for the order and the date groups. */
  updatedAt?: Date | undefined;
  /** Pinned chats sit in their own group at the top. */
  pinned?: boolean | undefined;
}

export type AiChatGroupKey = 'pinned' | 'today' | 'yesterday' | 'week' | 'older';

export interface AiChatGroup {
  key: AiChatGroupKey;
  chats: AiChatSummary[];
}

/** Collapses runs of white space and trims, so a pasted title reads as one line. */
function squash(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** The chats whose title holds every word of the query, in any case. An empty query keeps all. */
export function filterChats(chats: readonly AiChatSummary[], query: string): AiChatSummary[] {
  const words = squash(query).toLowerCase().split(' ').filter(Boolean);
  if (words.length === 0) return [...chats];
  return chats.filter((chat) => {
    const title = chat.title.toLowerCase();
    return words.every((word) => title.includes(word));
  });
}

const DAY = 24 * 60 * 60 * 1000;

/** Midnight at the start of the date's local day. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function groupOf(chat: AiChatSummary, today: number): AiChatGroupKey {
  if (chat.pinned === true) return 'pinned';
  if (chat.updatedAt === undefined || Number.isNaN(chat.updatedAt.getTime())) return 'older';
  const day = startOfDay(chat.updatedAt);
  // A time ahead of the clock (a skewed device) still counts as today.
  if (day >= today) return 'today';
  if (day >= today - DAY) return 'yesterday';
  if (day >= today - 6 * DAY) return 'week';
  return 'older';
}

const ORDER: readonly AiChatGroupKey[] = ['pinned', 'today', 'yesterday', 'week', 'older'];

/**
 * The chats in the list's groups, in order: pinned, today, yesterday, the previous seven days and
 * older, each newest first. Chats with no time sit last in older. Empty groups are left out.
 */
export function groupChats(chats: readonly AiChatSummary[], now: Date): AiChatGroup[] {
  const today = startOfDay(now);
  const time = (chat: AiChatSummary) => chat.updatedAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  const sorted = [...chats].sort((a, b) => {
    const diff = time(b) - time(a);
    return Number.isNaN(diff) ? 0 : diff;
  });
  const groups = new Map<AiChatGroupKey, AiChatSummary[]>();
  for (const chat of sorted) {
    const key = groupOf(chat, today);
    groups.set(key, [...(groups.get(key) ?? []), chat]);
  }
  return ORDER.flatMap((key) => {
    const list = groups.get(key);
    return list === undefined ? [] : [{ key, chats: list }];
  });
}

/** Where focus goes when a chat leaves the list: the one after it, else the one before, else none. */
export function focusAfterRemoval(ids: readonly string[], removed: string): string | null {
  const index = ids.indexOf(removed);
  if (index === -1) return null;
  return ids[index + 1] ?? ids[index - 1] ?? null;
}

/** The longest title the rename field keeps. */
export const MAX_CHAT_TITLE = 120;

/**
 * A title as typed, ready to save: one line, trimmed, at most `MAX_CHAT_TITLE` characters (never
 * cutting a character in two). Null when nothing is left or it did not change, so the rename is
 * dropped.
 */
export function cleanTitle(input: string, previous: string): string | null {
  const title = Array.from(squash(input)).slice(0, MAX_CHAT_TITLE).join('');
  return title === '' || title === previous ? null : title;
}

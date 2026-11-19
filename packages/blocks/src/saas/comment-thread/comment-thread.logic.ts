export interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ThreadComment {
  id: string;
  author: CommentAuthor;
  /** Plain text. Line breaks are kept and `@Name` mentions are picked out. */
  body: string;
  createdAt: Date;
  editedAt?: Date;
  /** The comment this one answers. Replies to a reply join the same top-level thread. */
  parentId?: string;
}

export interface CommentNode {
  comment: ThreadComment;
  replies: ThreadComment[];
}

const byDate = (a: ThreadComment, b: ThreadComment) =>
  a.createdAt.getTime() - b.createdAt.getTime();

/**
 * Top-level comments, oldest first, each with its replies, oldest first. Threads go one level
 * deep: a reply to a reply is placed under the top-level comment it descends from, and a reply
 * whose parent is gone becomes top-level so nothing is lost.
 */
export function commentTree(comments: readonly ThreadComment[]): CommentNode[] {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const rootOf = (comment: ThreadComment): ThreadComment => {
    const seen = new Set<string>();
    let current = comment;
    while (current.parentId !== undefined && !seen.has(current.id)) {
      seen.add(current.id);
      const parent = byId.get(current.parentId);
      if (parent === undefined) break;
      current = parent;
    }
    return current;
  };
  const nodes = new Map<string, CommentNode>();
  const sorted = [...comments].sort(byDate);
  for (const comment of sorted) {
    const root = rootOf(comment);
    if (root.id === comment.id) nodes.set(comment.id, { comment, replies: [] });
  }
  for (const comment of sorted) {
    const root = rootOf(comment);
    if (root.id !== comment.id) nodes.get(root.id)?.replies.push(comment);
  }
  return [...nodes.values()];
}

/** The people who took part, in the order they first spoke. */
export function commentParticipants(comments: readonly ThreadComment[]): CommentAuthor[] {
  const seen = new Map<string, CommentAuthor>();
  for (const comment of [...comments].sort(byDate)) {
    if (!seen.has(comment.author.id)) seen.set(comment.author.id, comment.author);
  }
  return [...seen.values()];
}

export const COMMENT_MAX_LENGTH = 4000;

/** Why a comment cannot be posted yet, or null when it can. */
export function commentBodyError(body: string, max = COMMENT_MAX_LENGTH): string | null {
  if (body.trim() === '') return 'Write something first.';
  if (body.length > max) {
    return `Keep it under ${String(max)} characters; this is ${String(body.length - max)} over.`;
  }
  return null;
}

export type CommentPart = { kind: 'text'; text: string } | { kind: 'mention'; text: string };

/**
 * A body split into text and `@mentions`, so mentions can be drawn apart. A mention is `@` after
 * a space or the start, followed by letters, digits, dots, hyphens or underscores.
 */
export function commentParts(body: string): CommentPart[] {
  const parts: CommentPart[] = [];
  let last = 0;
  for (const match of body.matchAll(/(^|\s)(@[\p{L}\p{N}._-]+)/gu)) {
    const start = match.index + (match[1]?.length ?? 0);
    if (start > last) parts.push({ kind: 'text', text: body.slice(last, start) });
    const mention = match[2] ?? '';
    parts.push({ kind: 'mention', text: mention });
    last = start + mention.length;
  }
  if (last < body.length) parts.push({ kind: 'text', text: body.slice(last) });
  return parts;
}

/** Who closed the discussion and when. */
export interface CommentThreadResolution {
  by: string;
  at: Date;
}

/** The key that sends with Enter: Cmd on Apple platforms, Ctrl everywhere else. */
export function commentSendModifier(platform: string | undefined): 'Cmd' | 'Ctrl' {
  return /mac|iphone|ipad|ipod/i.test(platform ?? '') ? 'Cmd' : 'Ctrl';
}

/** A slash command the composer offers when the reader types `/`. */
export interface AiComposerCommand {
  id: string;
  /** What follows the slash, such as `summarize`. Letters, digits, `-` and `_`. */
  name: string;
  /** One line on what it does. */
  description?: string | undefined;
  /** More words it is found by. */
  keywords?: readonly string[] | undefined;
}

/** A model or mode the reader can pick. */
export interface AiComposerModel {
  id: string;
  label: string;
  /** A short note beside the label in the list, such as `Fast` or `Best for code`. */
  hint?: string | undefined;
}

/** The slash word the caret sits at the end of: where it starts and what follows the slash. */
export interface SlashQuery {
  start: number;
  query: string;
}

/**
 * The slash command being typed: a `/` at the start of the field or after a space, followed by
 * name characters up to the caret. Null when the caret is anywhere else, so a path such as
 * `a/b` or a slash in the middle of a word never opens the list.
 */
export function slashQuery(text: string, caret: number): SlashQuery | null {
  const before = text.slice(0, Math.max(0, Math.min(caret, text.length)));
  const match = /(^|\s)\/([\w-]*)$/.exec(before);
  if (match === null) return null;
  const query = match[2] ?? '';
  return { start: before.length - query.length - 1, query };
}

/**
 * The commands that match a query, best first: names that start with it, then names, keywords
 * and descriptions that contain it. Case does not matter; an empty query lists every command in
 * the order given. At most `limit`.
 */
export function matchCommands(
  commands: readonly AiComposerCommand[],
  query: string,
  limit = 8,
): AiComposerCommand[] {
  const q = query.toLowerCase();
  if (q === '') return commands.slice(0, limit);
  const starts: AiComposerCommand[] = [];
  const contains: AiComposerCommand[] = [];
  for (const command of commands) {
    const name = command.name.toLowerCase();
    if (name.startsWith(q)) starts.push(command);
    else if (
      name.includes(q) ||
      (command.keywords ?? []).some((word) => word.toLowerCase().includes(q)) ||
      (command.description ?? '').toLowerCase().includes(q)
    )
      contains.push(command);
  }
  return [...starts, ...contains].slice(0, limit);
}

/**
 * The text with the slash word under the caret replaced by the command and a space, and where the
 * caret goes: just after that space.
 */
export function insertCommand(
  text: string,
  slash: SlashQuery,
  command: AiComposerCommand,
): { text: string; caret: number } {
  const inserted = `/${command.name} `;
  const end = slash.start + 1 + slash.query.length;
  const rest = text.slice(end).replace(/^ /, '');
  return {
    text: text.slice(0, slash.start) + inserted + rest,
    caret: slash.start + inserted.length,
  };
}

/**
 * A rough token count for when the app has no tokenizer: about four characters a token, the
 * usual rule for English with the common tokenizers. Pass `countTokens` for exact figures.
 */
export function estimateTokens(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : Math.ceil(trimmed.length / 4);
}

export type ComposerCountTone = 'quiet' | 'near' | 'over';

/** How close a count is to its limit: `near` from 90 percent, `over` past it. */
export function countTone(count: number, limit: number | undefined): ComposerCountTone {
  if (limit === undefined || !Number.isFinite(limit) || limit <= 0) return 'quiet';
  if (count > limit) return 'over';
  return count >= limit * 0.9 ? 'near' : 'quiet';
}

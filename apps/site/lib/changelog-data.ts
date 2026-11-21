/**
 * The changelog's shapes and its inline markdown, free of Node APIs so client components can
 * import them. lib/changelog.ts reads the files into these shapes at build time.
 */

/** The groups of a release, in the order the page lists them. */
export const AREAS = [
  { id: 'kit', label: 'Kit' },
  { id: 'templates', label: 'Templates' },
  { id: 'themes', label: 'Themes' },
  { id: 'cli', label: 'CLI' },
  { id: 'docs', label: 'Docs and site' },
] as const;

export type AreaId = (typeof AREAS)[number]['id'];

/** One line of a release. CLI notes from changesets can carry sub points. */
export interface ChangelogEntry {
  text: string;
  points: string[];
}

export interface ChangelogGroup {
  area: AreaId;
  label: string;
  entries: ChangelogEntry[];
}

export interface SiteRelease {
  /** The anchor: the date (`2026-11-21`), or `unreleased`. */
  id: string;
  /** ISO date; absent for the unreleased entry. */
  date?: string | undefined;
  title: string;
  summary?: string | undefined;
  /** A rectio version this release names, such as `0.1.0`. */
  version?: string | undefined;
  /** The @rectio/cli version that shipped with it, whose notes fill the CLI group. */
  cli?: string | undefined;
  groups: ChangelogGroup[];
}

/** Inline markdown in an entry: `code` and [text](url), everything else is plain text. */
export type InlinePart =
  | { kind: 'text'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'link'; value: string; href: string };

export function inlineParts(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const pattern = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let at = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > at) parts.push({ kind: 'text', value: text.slice(at, match.index) });
    if (match[1] !== undefined) parts.push({ kind: 'code', value: match[1] });
    else parts.push({ kind: 'link', value: match[2] ?? '', href: match[3] ?? '' });
    at = match.index + match[0].length;
  }
  if (at < text.length) parts.push({ kind: 'text', value: text.slice(at) });
  return parts;
}

/**
 * The rectio changelog, read at build time. Two sources, each written once:
 *
 * - content/changelog/*.md: one file per site release (`YYYY-MM-DD.md`, plus `unreleased.md` for
 *   work on main that has not shipped yet), with frontmatter and the entries grouped under area
 *   headings. CONTRIBUTING.md ("Changelog") has the format.
 * - packages/cli/CHANGELOG.md: written by changesets. A release that names a CLI version in its
 *   `cli` field gets that version's notes in its CLI group, so CLI notes are never typed twice.
 *
 * No React and no framework: the page, the feed and the tests all read through `readChangelog`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { AREAS, type AreaId, type ChangelogEntry, type SiteRelease } from './changelog-data.ts';

export * from './changelog-data.ts';

/** The site folder: the build, the dev server and the tests all run from apps/site. */
const SITE = process.cwd();
export const CHANGELOG_DIR = join(SITE, 'content', 'changelog');
export const CLI_CHANGELOG = join(SITE, '..', '..', 'packages', 'cli', 'CHANGELOG.md');

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FIELDS = new Set(['date', 'title', 'summary', 'version', 'cli']);

/** `key: value` lines between `---` fences, and the body after them. Values are plain text. */
export function splitFrontmatter(source: string, file: string) {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(source.replace(/\r\n/g, '\n'));
  if (match === null) throw new Error(`${file}: no frontmatter between --- lines`);
  const fields: Record<string, string> = {};
  for (const line of (match[1] ?? '').split('\n')) {
    if (line.trim() === '') continue;
    const at = line.indexOf(':');
    const key = line.slice(0, at).trim();
    if (at === -1 || !FIELDS.has(key))
      throw new Error(`${file}: unknown frontmatter line "${line}"`);
    fields[key] = line
      .slice(at + 1)
      .trim()
      .replace(/^(["'])(.*)\1$/, '$2');
  }
  return { fields, body: match[2] ?? '' };
}

/**
 * Markdown bullets under `## Area` headings. A bullet may wrap onto indented lines; an indented
 * `-` is a sub point of the bullet above it.
 */
export function parseGroups(body: string, file: string): Map<AreaId, ChangelogEntry[]> {
  const groups = new Map<AreaId, ChangelogEntry[]>();
  let entries: ChangelogEntry[] | null = null;
  let last: ChangelogEntry | null = null;
  for (const raw of body.split('\n')) {
    const line = raw.trimEnd();
    if (line.trim() === '') continue;
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading !== null) {
      const label = (heading[1] ?? '').trim();
      const area = AREAS.find((a) => a.label.toLowerCase() === label.toLowerCase());
      if (area === undefined) {
        throw new Error(
          `${file}: unknown heading "${label}"; use ${AREAS.map((a) => a.label).join(', ')}`,
        );
      }
      if (groups.has(area.id)) throw new Error(`${file}: "${label}" appears twice`);
      entries = [];
      last = null;
      groups.set(area.id, entries);
      continue;
    }
    if (entries === null) throw new Error(`${file}: "${line.trim()}" sits before any ## heading`);
    const bullet = /^-\s+(.+)$/.exec(line);
    const point = /^\s+-\s+(.+)$/.exec(line);
    if (bullet !== null) {
      last = { text: (bullet[1] ?? '').trim(), points: [] };
      entries.push(last);
    } else if (point !== null && last !== null) {
      last.points.push((point[1] ?? '').trim());
    } else if (/^\s+\S/.test(line) && last !== null) {
      // A wrapped line continues the bullet or sub point above it.
      if (last.points.length > 0) {
        const index = last.points.length - 1;
        last.points[index] = `${last.points[index] ?? ''} ${line.trim()}`;
      } else {
        last.text = `${last.text} ${line.trim()}`;
      }
    } else {
      throw new Error(`${file}: "${line.trim()}" is not a "- " bullet`);
    }
  }
  return groups;
}

/**
 * packages/cli/CHANGELOG.md as written by changesets: `## <version>`, `### <kind> Changes`, then
 * `- <hash>: <text>` bullets whose wrapped lines and sub bullets are indented. The commit hash is
 * dropped, and so are the "Updated dependencies" bullets changesets adds for internal bumps.
 */
export function parseCliChangelog(source: string): Map<string, ChangelogEntry[]> {
  const versions = new Map<string, ChangelogEntry[]>();
  let entries: ChangelogEntry[] | null = null;
  let last: ChangelogEntry | null = null;
  for (const raw of source.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    const version = /^##\s+(\S+)\s*$/.exec(line);
    if (version !== null) {
      entries = [];
      last = null;
      versions.set(version[1] ?? '', entries);
      continue;
    }
    if (entries === null || line.trim() === '' || line.startsWith('#')) continue;
    const bullet = /^-\s+(?:[0-9a-f]{7,40}:\s+)?(.+)$/.exec(line);
    const point = /^\s+-\s+(.+)$/.exec(line);
    if (bullet !== null) {
      const text = (bullet[1] ?? '').trim();
      last = text.startsWith('Updated dependencies') ? null : { text, points: [] };
      if (last !== null) entries.push(last);
    } else if (point !== null && last !== null) {
      last.points.push((point[1] ?? '').trim());
    } else if (last !== null) {
      if (last.points.length > 0) {
        const index = last.points.length - 1;
        last.points[index] = `${last.points[index] ?? ''} ${line.trim()}`;
      } else {
        last.text = `${last.text} ${line.trim()}`;
      }
    }
  }
  return versions;
}

/** One content file and the CLI notes, as a release with its groups in `AREAS` order. */
export function buildRelease(
  name: string,
  source: string,
  cliNotes: Map<string, ChangelogEntry[]>,
): SiteRelease {
  const file = `content/changelog/${name}`;
  const stem = name.replace(/\.md$/, '');
  const { fields, body } = splitFrontmatter(source, file);
  const unreleased = stem === 'unreleased';
  if (unreleased) {
    if (fields.date !== undefined) throw new Error(`${file}: the unreleased entry has no date`);
  } else {
    if (!DATE.test(stem)) throw new Error(`${file}: name it YYYY-MM-DD.md or unreleased.md`);
    if (fields.date !== stem) throw new Error(`${file}: date must be ${stem}, as the file name`);
  }
  if (fields.title === undefined || fields.title === '') throw new Error(`${file}: no title`);

  const written = parseGroups(body, file);
  const cliEntries = fields.cli === undefined ? [] : cliNotes.get(fields.cli);
  if (cliEntries === undefined) {
    throw new Error(`${file}: cli ${String(fields.cli)} is not in packages/cli/CHANGELOG.md`);
  }
  const groups = AREAS.map((area) => ({
    area: area.id,
    label: area.label,
    entries: [...(written.get(area.id) ?? []), ...(area.id === 'cli' ? cliEntries : [])],
  })).filter((group) => group.entries.length > 0);
  if (groups.length === 0) throw new Error(`${file}: no entries`);

  return {
    id: unreleased ? 'unreleased' : stem,
    date: unreleased ? undefined : stem,
    title: fields.title,
    summary: fields.summary,
    version: fields.version,
    cli: fields.cli,
    groups,
  };
}

/** Unreleased first, then newest first. */
export function sortReleases(releases: readonly SiteRelease[]): SiteRelease[] {
  return [...releases].sort((a, b) => (b.date ?? '9999').localeCompare(a.date ?? '9999'));
}

export function readChangelog(
  dir: string = CHANGELOG_DIR,
  cliChangelog: string = CLI_CHANGELOG,
): SiteRelease[] {
  if (!existsSync(dir)) return [];
  const cliNotes = existsSync(cliChangelog)
    ? parseCliChangelog(readFileSync(cliChangelog, 'utf8'))
    : new Map<string, ChangelogEntry[]>();
  const releases = readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => buildRelease(name, readFileSync(join(dir, name), 'utf8'), cliNotes));
  return sortReleases(releases);
}

/** The newest shipped release, for the "What's new" links. */
export function latestRelease(releases: readonly SiteRelease[]): SiteRelease | undefined {
  return releases.find((release) => release.date !== undefined);
}

/**
 * The changelog sources parse, stay in the documented format, pull the CLI notes from changesets,
 * and reach the static export as a page and a feed.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  buildRelease,
  inlineParts,
  latestRelease,
  parseCliChangelog,
  readChangelog,
} from '../lib/changelog.ts';
import { changelogFeed } from '../lib/changelog-feed.ts';

const OUT = join(import.meta.dirname, '..', 'out');

const CLI = `# @rectio/cli

## 0.2.0

### Minor Changes

- abc1234: Adds a thing.

  - With a detail that
    wraps.

### Patch Changes

- Updated dependencies [abc1234]

## 0.1.1

### Patch Changes

- def5678: Fixes a thing.
`;

void test('the CLI changelog parses into versions without hashes or dependency bumps', () => {
  const notes = parseCliChangelog(CLI);
  assert.deepEqual([...notes.keys()], ['0.2.0', '0.1.1']);
  assert.deepEqual(notes.get('0.2.0'), [
    { text: 'Adds a thing.', points: ['With a detail that wraps.'] },
  ]);
  assert.deepEqual(notes.get('0.1.1'), [{ text: 'Fixes a thing.', points: [] }]);
});

void test('a release takes its CLI group from the version it names, after written CLI lines', () => {
  const release = buildRelease(
    '2026-12-01.md',
    '---\ndate: 2026-12-01\ntitle: Things\ncli: 0.2.0\n---\n\n## CLI\n\n- Written by hand.\n\n## Kit\n\n- A fix.\n',
    parseCliChangelog(CLI),
  );
  assert.equal(release.id, '2026-12-01');
  assert.deepEqual(
    release.groups.map((g) => g.area),
    ['kit', 'cli'],
  );
  assert.deepEqual(
    release.groups[1]?.entries.map((e) => e.text),
    ['Written by hand.', 'Adds a thing.'],
  );
});

void test('a release file outside the format is refused with its name', () => {
  const notes = parseCliChangelog(CLI);
  const make = (name: string, source: string) => () => buildRelease(name, source, notes);
  assert.throws(
    make('2026-12-01.md', '---\ndate: 2026-12-02\ntitle: X\n---\n## Kit\n- a\n'),
    /date must be 2026-12-01/,
  );
  assert.throws(
    make('2026-12-01.md', '---\ndate: 2026-12-01\ntitle: X\n---\n## Misc\n- a\n'),
    /unknown heading "Misc"/,
  );
  assert.throws(
    make('2026-12-01.md', '---\ndate: 2026-12-01\ntitle: X\ncli: 9.9.9\n---\n## Kit\n- a\n'),
    /cli 9.9.9/,
  );
  assert.throws(make('notes.md', '---\ntitle: X\n---\n## Kit\n- a\n'), /YYYY-MM-DD/);
  assert.throws(
    make('unreleased.md', '---\ntitle: X\nauthor: me\n---\n## Kit\n- a\n'),
    /unknown frontmatter/,
  );
});

void test('inline code and links are split out of entry text', () => {
  assert.deepEqual(inlineParts('Run `init` or see [the docs](/docs).'), [
    { kind: 'text', value: 'Run ' },
    { kind: 'code', value: 'init' },
    { kind: 'text', value: ' or see ' },
    { kind: 'link', value: 'the docs', href: '/docs' },
    { kind: 'text', value: '.' },
  ]);
});

void test('the real changelog reads, unreleased first, then newest first, with no dashes', () => {
  const releases = readChangelog();
  assert.ok(releases.length >= 2, 'expected the backfilled releases');
  const dated = releases.filter((r) => r.date !== undefined).map((r) => r.date ?? '');
  assert.deepEqual(dated, [...dated].sort().reverse());
  const unreleased = releases.findIndex((r) => r.date === undefined);
  assert.ok(unreleased <= 0, 'the unreleased entry comes first');
  assert.equal(latestRelease(releases)?.date, dated[0]);
  for (const release of releases) {
    const text = JSON.stringify(release);
    assert.ok(!/[–—]/.test(text), `${release.id} has an em or en dash`);
  }
  const cli = releases.find((r) => r.cli !== undefined);
  assert.ok(cli?.groups.some((g) => g.area === 'cli' && g.entries.length > 0));
});

void test('the feed lists only shipped releases with absolute links', () => {
  const feed = changelogFeed(readChangelog(), 'https://example.com/rectio');
  assert.ok(feed.startsWith('<?xml'));
  assert.ok(!feed.includes('#unreleased'));
  assert.ok(!feed.includes('href=&quot;/docs'), 'site links in entries are absolute');
});

void test('the static export holds the changelog page and its feed', () => {
  assert.ok(
    existsSync(join(OUT, 'changelog.html')),
    'out/changelog.html is missing: build the site through turbo or pnpm build',
  );
  const feed = readFileSync(join(OUT, 'changelog.xml'), 'utf8');
  assert.match(feed, /<feed xmlns="http:\/\/www.w3.org\/2005\/Atom">/);
  const page = readFileSync(join(OUT, 'changelog.html'), 'utf8');
  for (const release of readChangelog()) {
    assert.ok(page.includes(`id="${release.id}"`), `the page has no anchor for ${release.id}`);
  }
});

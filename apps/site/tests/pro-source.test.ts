import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

const SITE = join(import.meta.dirname, '..');
const OUT = join(SITE, 'out');
const MOTION_SRC = join(SITE, '..', '..', 'packages', 'motion', 'src');
const UI_SRC = join(SITE, '..', '..', 'packages', 'ui', 'src');

function files(dir: string, keep: (name: string) => boolean): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && keep(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));
}

/** Comment lines survive only in source, never in minified code: finding one means source shipped. */
function commentLines(file: string): string[] {
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('// ') && line.length > 40)
    .map((line) => line.slice(3));
}

const published = files(OUT, (name) => /\.(html|js|txt|json)$/.test(name)).map((file) => ({
  path: relative(OUT, file),
  text: readFileSync(file, 'utf8'),
}));

void test('the static export exists', () => {
  assert.ok(published.length > 0, 'build the site first: out/ is empty');
});

void test('no Pro motion source is published', () => {
  const motionFiles = files(MOTION_SRC, (name) => /\.tsx?$/.test(name) && !name.includes('.test.'));
  const lines = motionFiles.flatMap(commentLines);
  assert.ok(lines.length > 5, 'expected comment lines in the motion source to check against');
  for (const line of lines) {
    const leak = published.find((file) => file.text.includes(line));
    assert.equal(leak, undefined, `motion source line found in out/${leak?.path ?? ''}: ${line}`);
  }
});

void test('free component source is shown on its page', () => {
  const page = published.find((file) => file.path === join('docs', 'components', 'button.html'));
  assert.ok(page, 'docs/components/button.html is missing');
  const lines = commentLines(join(UI_SRC, 'button', 'button.tsx'));
  assert.ok(lines.length > 0);
  // Code blocks are highlighted token by token, so compare the words with the markup removed.
  const text = page.text
    .replace(/<[^>]+>/g, '')
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"');
  assert.ok(
    lines.some((line) => text.includes(line)),
    'the Button page does not show the free source',
  );
});

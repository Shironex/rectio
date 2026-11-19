import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

const SITE = join(import.meta.dirname, '..');
const OUT = join(SITE, 'out');
const MOTION_SRC = join(SITE, '..', '..', 'packages', 'motion', 'src');
const UI_SRC = join(SITE, '..', '..', 'packages', 'ui', 'src');
const BLOCKS_SRC = join(SITE, '..', '..', 'packages', 'blocks', 'src');
const TEMPLATES = join(SITE, '..', '..', 'templates');

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

void test('no Pro block source is published', () => {
  const blockFiles = files(BLOCKS_SRC, (name) => /\.tsx?$/.test(name) && !name.includes('.test.'));
  const lines = blockFiles.flatMap(commentLines);
  assert.ok(lines.length > 5, 'expected comment lines in the blocks source to check against');
  for (const line of lines) {
    const leak = published.find((file) => file.text.includes(line));
    assert.equal(leak, undefined, `block source line found in out/${leak?.path ?? ''}: ${line}`);
  }
});

void test('no Pro template source is published', () => {
  // The site shows templates as screenshots and their template.json; their code stays in pro/.
  const templateFiles = readdirSync(TEMPLATES, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      ['app', 'components', 'data']
        .map((folder) => join(TEMPLATES, entry.name, folder))
        .filter((dir) => existsSync(dir))
        .flatMap((dir) => files(dir, (name) => /\.tsx?$/.test(name))),
    );
  const lines = templateFiles.flatMap(commentLines);
  assert.ok(lines.length > 5, 'expected comment lines in the template source to check against');
  for (const line of lines) {
    const leak = published.find((file) => file.text.includes(line));
    assert.equal(leak, undefined, `template source line found in out/${leak?.path ?? ''}: ${line}`);
  }
});

void test('every template has a published page marked Pro, with its screenshots', () => {
  const names = readdirSync(TEMPLATES, { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && existsSync(join(TEMPLATES, entry.name, 'template.json')),
    )
    .map((entry) => entry.name);
  for (const name of ['finance-app', 'saas-landing', 'product-launch', 'docs']) {
    assert.ok(names.includes(name), `expected the ${name} template`);
  }
  for (const name of names) {
    const page = published.find((file) => file.path === join('docs', 'templates', `${name}.html`));
    assert.ok(page, `docs/templates/${name}.html is missing`);
    assert.match(page.text, />Pro</, `docs/templates/${name}.html is not marked Pro`);
    const manifest = JSON.parse(readFileSync(join(TEMPLATES, name, 'template.json'), 'utf8')) as {
      screenshots: string[];
    };
    for (const shot of manifest.screenshots) {
      const file = join(OUT, 'templates', name, shot.slice('screenshots/'.length));
      assert.ok(existsSync(file), `out/templates/${name}/${shot} is missing`);
    }
  }
  const landing = published.find((file) => file.path === 'index.html');
  for (const name of names) {
    assert.ok(
      landing?.text.includes(`/docs/templates/${name}`),
      `the landing does not show ${name}`,
    );
  }
});

void test('every block has a published page marked Pro', () => {
  const blocks = readdirSync(BLOCKS_SRC, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'lib')
    .map((entry) => entry.name);
  assert.ok(blocks.length >= 8, `expected the finance blocks, found ${String(blocks.length)}`);
  for (const block of blocks) {
    const page = published.find((file) => file.path === join('docs', 'blocks', `${block}.html`));
    assert.ok(page, `docs/blocks/${block}.html is missing`);
    assert.match(page.text, />Pro</, `docs/blocks/${block}.html is not marked Pro`);
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

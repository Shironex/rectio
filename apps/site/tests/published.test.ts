/**
 * What the static export must hold: a page for every template and block, the source shown on
 * component pages and beside each motion preview, and the registry the CLI reads under r/.
 * Templates come from readTemplates(), so a new template folder is checked with no change here.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

import { readTemplates } from '../lib/templates.ts';

const SITE = join(import.meta.dirname, '..');
const OUT = join(SITE, 'out');
const UI_SRC = join(SITE, '..', '..', 'packages', 'ui', 'src');
const BLOCKS_SRC = join(SITE, '..', '..', 'packages', 'blocks', 'src');

function files(dir: string, keep: (name: string) => boolean): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && keep(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));
}

/** Comment lines of a source file: they survive highlighting as plain words. */
function commentLines(file: string): string[] {
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('// ') && line.length > 40)
    .map((line) => line.slice(3));
}

/** A page's text with the markup removed: code blocks are highlighted token by token. */
function pageText(path: string): string {
  const file = join(OUT, path);
  assert.ok(existsSync(file), `out/${path} is missing: build the site first`);
  return readFileSync(file, 'utf8')
    .replace(/<[^>]+>/g, '')
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

const published = files(OUT, (name) => name.endsWith('.html')).map((file) => relative(OUT, file));

void test('the static export exists', () => {
  assert.ok(published.length > 0, 'build the site first: out/ is empty');
});

void test('every template has a docs page with its screenshots, and the landing shows it', () => {
  const templates = readTemplates();
  assert.ok(templates.length > 0, 'expected the templates');
  const landing = readFileSync(join(OUT, 'index.html'), 'utf8');
  for (const template of templates) {
    assert.ok(
      published.includes(join('docs', 'templates', `${template.name}.html`)),
      `docs/templates/${template.name}.html is missing`,
    );
    const shots = Object.values(template.shots).filter((shot) => shot !== undefined);
    for (const shot of shots) {
      const file = join(OUT, 'templates', template.name, shot.split('/').at(-1) ?? '');
      assert.ok(existsSync(file), `the screenshot ${shot} is missing from out/`);
    }
    assert.ok(
      landing.includes(`/docs/templates/${template.name}`),
      `the landing lacks ${template.name}`,
    );
  }
});

void test('every finance block has a docs page', () => {
  // The finance blocks are the folders of packages/blocks/src without folders of their own.
  const blocks = readdirSync(BLOCKS_SRC, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'lib')
    .map((entry) => entry.name)
    .filter((name) =>
      readdirSync(join(BLOCKS_SRC, name), { withFileTypes: true }).every((e) => !e.isDirectory()),
    );
  assert.ok(blocks.length >= 8, `expected the finance blocks, found ${String(blocks.length)}`);
  for (const block of blocks) {
    assert.ok(
      published.includes(join('docs', 'blocks', `${block}.html`)),
      `docs/blocks/${block}.html is missing`,
    );
  }
});

void test('a component page shows the component source', () => {
  const lines = commentLines(join(UI_SRC, 'button', 'button.tsx'));
  assert.ok(lines.length > 0);
  const text = pageText(join('docs', 'components', 'button.html'));
  assert.ok(
    lines.some((line) => text.includes(line)),
    'the Button page does not show its source',
  );
});

void test('a motion preview shows the motion demo code', () => {
  const demo = readFileSync(join(SITE, 'demos', 'switch.motion.tsx'), 'utf8');
  const motionImport = /from '(@rectio\/motion[^']*)'/.exec(demo)?.[1];
  assert.ok(motionImport !== undefined, 'demos/switch.motion.tsx imports no @rectio/motion path');
  assert.ok(
    pageText(join('docs', 'components', 'switch.html')).includes(motionImport),
    'the Switch page does not show the motion demo code',
  );
});

void test('the registry is published under r/, every item at items/<name>.json', () => {
  const index = JSON.parse(readFileSync(join(OUT, 'r', 'index.json'), 'utf8')) as {
    items: { name: string }[];
  };
  assert.ok(
    index.items.length > 100,
    `expected the registry items, found ${String(index.items.length)}`,
  );
  for (const item of index.items) {
    assert.ok(
      existsSync(join(OUT, 'r', 'items', `${item.name}.json`)),
      `r/items/${item.name}.json`,
    );
  }
  assert.ok(existsSync(join(OUT, '.nojekyll')), 'out/.nojekyll is missing');
});

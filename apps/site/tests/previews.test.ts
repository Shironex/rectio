import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

import { prepareHtml } from '../lib/previews.ts';
import { fitScale, initialDevice, pathInPreview, routeFor, routeMatches } from '../lib/viewer.ts';

const SITE = join(import.meta.dirname, '..');
const OUT = join(SITE, 'out');
const TEMPLATES = join(SITE, '..', '..', 'templates');

const names = readdirSync(TEMPLATES, { withFileTypes: true })
  .filter(
    (entry) => entry.isDirectory() && existsSync(join(TEMPLATES, entry.name, 'template.json')),
  )
  .map((entry) => entry.name);

function files(dir: string, keep: (name: string) => boolean): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && keep(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));
}

void test('every template has a live preview and a viewer page', () => {
  assert.ok(names.length >= 4, `expected the templates, found ${String(names.length)}`);
  for (const name of names) {
    assert.ok(
      existsSync(join(OUT, 'preview', name, 'index.html')),
      `out/preview/${name}/index.html is missing: build the site through turbo or pnpm build`,
    );
    assert.ok(existsSync(join(OUT, 'templates', `${name}.html`)), `out/templates/${name}.html`);
  }
  assert.ok(existsSync(join(OUT, 'templates.html')), 'the templates gallery is missing');
});

void test('nothing in a preview points at the site root instead of the preview', () => {
  for (const name of names) {
    const root = join(OUT, 'preview', name);
    const base = `/preview/${name}`;
    const inside = (url: string) =>
      url.startsWith('//') || url === base || url.startsWith(`${base}/`);
    const problems: string[] = [];
    for (const file of files(root, (n) => n.endsWith('.html'))) {
      const html = readFileSync(file, 'utf8');
      const where = relative(OUT, file);
      assert.ok(html.includes('data-rectio-preview'), `${where} was not prepared`);
      assert.match(html, /<meta name="robots" content="noindex/, `${where} is not noindex`);
      for (const m of html.matchAll(
        /<(\w+)([^>]*?)\s(href|src|srcset|action|poster)="(\/[^"]*)"/g,
      )) {
        const [, tag = '', attrs = '', , url = ''] = m;
        // Next's own preconnect to the origin is not a link a visitor follows.
        if (tag === 'link' && attrs.includes('preconnect')) continue;
        if (!inside(url)) problems.push(`${where}: <${tag}> ${url}`);
      }
    }
    for (const file of files(root, (n) => /\.(?:css|js)$/.test(n))) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/url\((["']?)(\/[^)"']*)\1\)/g)) {
        if (!inside(m[2] ?? '')) problems.push(`${relative(OUT, file)}: url(${m[2] ?? ''})`);
      }
      // Asset paths the bundler writes: always under the base path.
      for (const m of text.matchAll(/["'`](\/_next\/[^"'`]*)/g)) {
        problems.push(`${relative(OUT, file)}: ${m[1] ?? ''}`);
      }
    }
    assert.deepEqual(problems.slice(0, 20), [], `${name} has un-prefixed paths`);
  }
});

void test('a preview page is prepared once: noindex, links moved under the base path, the guard', () => {
  const page =
    '<html><head><title>x</title></head><body><a href="/pricing">p</a><a class="c" href="/preview/x/a">a</a><a href="//cdn.example/x">c</a><a href="#top">t</a><img src="/logo.svg"></body></html>';
  const once = prepareHtml(page, '/preview/x');
  assert.match(once, /<meta name="robots" content="noindex, nofollow"/);
  assert.match(once, /<a href="\/preview\/x\/pricing">/);
  assert.match(once, /<a class="c" href="\/preview\/x\/a">/);
  assert.match(once, /href="\/\/cdn\.example\/x"/);
  assert.match(once, /href="#top"/);
  assert.match(once, /new MutationObserver/);
  assert.equal(prepareHtml(once, '/preview/x'), once);
  // A page that is already noindex (Next's 404) keeps its tag and still gets the guard.
  const notFound = prepareHtml(
    '<html><head><meta name="robots" content="noindex"/></head></html>',
    '/b',
  );
  assert.equal(notFound.match(/name="robots"/g)?.length, 1);
  assert.match(notFound, /new MutationObserver/);
});

void test('the viewer resolves routes and widths', () => {
  assert.ok(routeMatches('/invoices/[id]', '/invoices/inv-2026-0216'));
  assert.ok(!routeMatches('/invoices/[id]', '/invoices'));
  assert.ok(!routeMatches('/invoices/[id]', '/invoices/a/b'));
  assert.ok(routeMatches('/docs/[...slug]', '/docs/a/b'));
  assert.ok(!routeMatches('/docs/[...slug]', '/docs'));
  assert.ok(routeMatches('/docs/[[...slug]]', '/docs'));
  const routes = ['/', '/invoices', '/invoices/[id]', '/404'];
  assert.equal(routeFor(routes, '/invoices/'), '/invoices');
  assert.equal(routeFor(routes, '/invoices/inv-1'), '/invoices/[id]');
  assert.equal(routeFor(routes, '/'), '/');
  assert.equal(routeFor(routes, '/settings'), undefined);
  assert.equal(pathInPreview('/preview/x', '/preview/x/'), '/');
  assert.equal(pathInPreview('/preview/x', '/preview/x/pricing/'), '/pricing');
  assert.equal(fitScale(640, 1280), 0.5);
  assert.equal(fitScale(1600, 1280), 1);
  assert.equal(initialDevice(1392), 'desktop');
  assert.equal(initialDevice(900), 'tablet');
  assert.equal(initialDevice(358), 'phone');
});

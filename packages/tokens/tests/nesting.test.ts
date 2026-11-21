// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

// jsdom's URL is not a file URL to node:fs, so the built files are read by path.

/**
 * Skins that nest, resolved by the browser cascade (jsdom) over the built themes.css: the nearest
 * skin wins whatever order the rules are written in, `data-skin="none"` turns an outer skin off,
 * and compact density still applies on top.
 */
const css = readFileSync(join(import.meta.dirname, '../dist/themes.css'), 'utf8');
const built = JSON.parse(
  readFileSync(join(import.meta.dirname, '../dist/tokens.json'), 'utf8'),
) as {
  themes: Record<string, Record<string, Record<string, string>>>;
  skins: Record<string, { tokens: Record<string, string> }>;
};
const base = built.themes.default?.light ?? {};
const dense = built.skins.dense?.tokens ?? {};
const editorial = built.skins.editorial?.tokens ?? {};

/** A skin of your own, written after the shipped ones the way the skins page shows. */
const ROOMY = `[data-skin='roomy'],
[data-skin='roomy'][data-theme] {
  --rx-radius-panel: 0.75rem;
  --rx-space-unit: 0.3rem;
}
[data-skin='roomy'] :where([data-theme]:not([data-skin])) {
  --rx-radius-panel: inherit;
  --rx-space-unit: inherit;
}`;

beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = `${css}\n${ROOMY}`;
  document.head.append(style);
});

/** Render `html` under a root carrying `rootSkin`, then read `name` on the element with id `t`. */
function read(rootSkin: string | undefined, html: string, name = '--rx-radius-panel'): string {
  const root = document.documentElement;
  root.setAttribute('data-theme', 'default');
  if (rootSkin === undefined) root.removeAttribute('data-skin');
  else root.setAttribute('data-skin', rootSkin);
  document.body.innerHTML = html;
  const el = document.getElementById('t');
  if (el === null) throw new Error('no #t');
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/** A ThemeScope as it renders: data-theme always, data-skin when set. */
const scope = (skin?: string, inner = '<span id="t"></span>') =>
  `<div data-theme="default"${skin === undefined ? '' : ` data-skin="${skin}"`}>${inner}</div>`;

describe('nested skins: the nearest one wins', () => {
  it('editorial scope inside a dense page, and the reverse', () => {
    expect(read('dense', scope('editorial'))).toBe(editorial['--rx-radius-panel']);
    expect(read('editorial', scope('dense'))).toBe(dense['--rx-radius-panel']);
  });

  it('a plain data-skin wrapper around a theme scope', () => {
    const wrapped = (skin: string) => `<div data-skin="${skin}">${scope()}</div>`;
    expect(read('editorial', wrapped('dense'))).toBe(dense['--rx-radius-panel']);
    expect(read('dense', wrapped('editorial'))).toBe(editorial['--rx-radius-panel']);
  });

  it('a theme scope with no skin of its own keeps the page skin', () => {
    expect(read('dense', scope())).toBe(dense['--rx-radius-panel']);
    expect(read('editorial', scope(undefined, scope()))).toBe(editorial['--rx-radius-panel']);
  });

  it('a skin of your own written after the shipped ones, in either nesting', () => {
    expect(read('roomy', scope('dense'))).toBe(dense['--rx-radius-panel']);
    expect(read('dense', scope('roomy'))).toBe('0.75rem');
    expect(read('roomy', `<div data-skin="editorial">${scope()}</div>`)).toBe(
      editorial['--rx-radius-panel'],
    );
    expect(read('editorial', `<div data-skin="roomy">${scope()}</div>`)).toBe('0.75rem');
  });

  it('three levels deep', () => {
    const html = `<div data-skin="editorial">${scope('roomy', scope('dense', scope()))}</div>`;
    expect(read('dense', html)).toBe(dense['--rx-radius-panel']);
  });
});

describe('data-skin="none"', () => {
  it('turns an outer skin off for a theme scope and the themes inside it', () => {
    expect(read('dense', scope('none'))).toBe(base['--rx-radius-panel']);
    expect(read('editorial', scope('none', scope()))).toBe(base['--rx-radius-panel']);
    expect(read('roomy', scope('none'))).toBe(base['--rx-radius-panel']);
  });
});

describe('compact density with nested skins', () => {
  const compactUnit = /\[data-density="compact"\][^{]*\{[^}]*--rx-space-unit: ([^;]+);/.exec(
    css,
  )?.[1];

  it('applies on a skinned scope inside another skin', () => {
    const html = `<div data-theme="default" data-skin="dense" data-density="compact"><span id="t"></span></div>`;
    expect(read('editorial', html, '--rx-space-unit')).toBe(compactUnit);
  });

  it('applies around a skinned scope', () => {
    const html = `<div data-density="compact">${scope('editorial')}</div>`;
    expect(read('dense', html, '--rx-space-unit')).toBe(compactUnit);
  });
});

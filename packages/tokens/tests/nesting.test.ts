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
const glass = built.skins.glass?.tokens ?? {};
const brutalist = built.skins.brutalist?.tokens ?? {};
const dark = built.themes.default?.dark ?? {};

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

describe('glass and brutalist nest like the others', () => {
  it('a glass scope inside a brutalist page, and the reverse', () => {
    expect(read('brutalist', scope('glass'))).toBe(glass['--rx-radius-panel']);
    expect(read('glass', scope('brutalist'))).toBe(brutalist['--rx-radius-panel']);
    expect(read('glass', scope('brutalist'), '--rx-shadow-offset-overlay')).toBe(
      brutalist['--rx-shadow-offset-overlay'],
    );
  });

  it('a theme scope inside brutalist inside glass takes the nearest switches', () => {
    const html = `<div data-skin="brutalist">${scope()}</div>`;
    expect(read('glass', html, '--rx-border-ink')).toBe(brutalist['--rx-border-ink']);
    // Glass's own switch, which brutalist leaves alone, still reaches it.
    expect(read('glass', html, '--rx-shadow-highlight')).toBe(glass['--rx-shadow-highlight']);
  });

  // A switch is the same in light and dark, so it carries into a scope of the other mode, while
  // the colours it turns on stay that scope's own.
  it('a dark scope inside a light brutalist page keeps dark colours', () => {
    const html = '<div data-theme="default" data-mode="dark"><span id="t"></span></div>';
    expect(read('brutalist', html, '--rx-shadow-offset-raised')).toBe(
      brutalist['--rx-shadow-offset-raised'],
    );
    expect(read('brutalist', html, '--rx-shadow-offset-color')).toBe(
      dark['--rx-shadow-offset-color'],
    );
    expect(read('glass', html, '--rx-border-highlight')).toBe(dark['--rx-border-highlight']);
  });
});

describe('data-skin="none"', () => {
  it('turns an outer skin off for a theme scope and the themes inside it', () => {
    expect(read('dense', scope('none'))).toBe(base['--rx-radius-panel']);
    expect(read('editorial', scope('none', scope()))).toBe(base['--rx-radius-panel']);
    expect(read('roomy', scope('none'))).toBe(base['--rx-radius-panel']);
    expect(read('glass', scope('none'))).toBe(base['--rx-radius-panel']);
    expect(read('brutalist', scope('none'), '--rx-border-ink')).toBe(base['--rx-border-ink']);
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

/**
 * A custom property resolved the way the browser computes it: every `var()` replaced from the
 * cascade on the element (with its fallback when unset), then `calc()`, `max()` and `min()`
 * evaluated in px (1rem = 16px).
 */
function resolvePx(el: Element, value: string, depth = 0): number {
  if (depth > 20) throw new Error(`var() cycle in ${value}`);
  let text = value;
  // Innermost var() first, so a fallback that is itself a var() resolves too.
  for (;;) {
    const m = /var\((--[\w-]+)(?:,\s*([^()]*))?\)/.exec(text);
    if (m === null) break;
    const own = getComputedStyle(el)
      .getPropertyValue(m[1] ?? '')
      .trim();
    const sub = own === '' ? (m[2] ?? '').trim() : own;
    if (sub === '') throw new Error(`${m[1] ?? ''} is unset with no fallback`);
    text = text.replace(m[0], `(${String(resolvePx(el, sub, depth + 1))}px)`);
  }
  const src = text
    .replace(/(-?\d*\.?\d+)rem/g, (_, n: string) => String(Number(n) * 16))
    .replace(/(\d*\.?\d+)px/g, '$1')
    .replace(/calc\(/g, '(');
  return evaluate(src);
}

/** Arithmetic over plain numbers: + - * /, parentheses, max() and min(). */
function evaluate(src: string): number {
  const tokens = src.match(/\d*\.?\d+|max|min|[-+*/(),]/g) ?? [];
  let at = 0;
  const peek = () => tokens[at];
  const take = (want?: string) => {
    const t = tokens[at++];
    if (want !== undefined && t !== want) throw new Error(`expected ${want} in ${src}`);
    return t ?? '';
  };
  const sum = (): number => {
    let v = product();
    while (peek() === '+' || peek() === '-') v = take() === '+' ? v + product() : v - product();
    return v;
  };
  const product = (): number => {
    let v = unary();
    while (peek() === '*' || peek() === '/') v = take() === '*' ? v * unary() : v / unary();
    return v;
  };
  const unary = (): number => {
    if (peek() === '-') {
      take();
      return -unary();
    }
    const t = take();
    if (t === '(') {
      const v = sum();
      take(')');
      return v;
    }
    if (t === 'max' || t === 'min') {
      take('(');
      const args = [sum()];
      while (peek() === ',') {
        take();
        args.push(sum());
      }
      take(')');
      return t === 'max' ? Math.max(...args) : Math.min(...args);
    }
    const n = Number(t);
    if (Number.isNaN(n)) throw new Error(`cannot evaluate ${src}`);
    return n;
  };
  const v = sum();
  if (at !== tokens.length) throw new Error(`cannot evaluate ${src}`);
  return v;
}

describe('touch heights hold 44px in every skin, nested and compact', () => {
  const TOUCH = [
    '--rx-field-height-touch',
    '--rx-table-row-height-touch',
    '--rx-button-height-touch',
  ];
  const cases: [string, string | undefined, string][] = [
    ['no skin', undefined, '<span id="t"></span>'],
    ...(['dense', 'editorial', 'glass', 'brutalist'] as const).map(
      (s) => [s, s, '<span id="t"></span>'] as [string, string, string],
    ),
    ['editorial inside brutalist', 'brutalist', scope('editorial')],
    ['brutalist inside editorial', 'editorial', scope('brutalist')],
    ['glass inside dense', 'dense', scope('glass')],
    ['compact editorial', 'editorial', '<div data-density="compact"><span id="t"></span></div>'],
    ['compact brutalist', 'brutalist', '<div data-density="compact"><span id="t"></span></div>'],
    ['compact dense', 'dense', `<div data-density="compact">${scope('dense')}</div>`],
  ];
  it.each(cases)('%s', (_, skin, html) => {
    read(skin, html);
    const el = document.getElementById('t');
    if (el === null) throw new Error('no #t');
    for (const name of TOUCH) {
      const declared = getComputedStyle(el).getPropertyValue(name).trim();
      expect(resolvePx(el, declared), name).toBeGreaterThanOrEqual(44);
    }
  });

  it('grows with a border wider than 1px', () => {
    read('brutalist', '<span id="t"></span>');
    const el = document.getElementById('t');
    if (el === null) throw new Error('no #t');
    const field = getComputedStyle(el).getPropertyValue('--rx-field-height-touch').trim();
    expect(resolvePx(el, field)).toBe(46);
  });
});

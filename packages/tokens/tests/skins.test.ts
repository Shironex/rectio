import { readFileSync, readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { SKINS, skinViolation } from '../scripts/naming.ts';

interface Built {
  contract: { name: string; type: string }[];
  themes: Record<string, Record<string, Record<string, string>>>;
  skins: Record<
    string,
    {
      tokens: Record<string, string>;
      themes: Record<string, Record<string, Record<string, string>>>;
    }
  >;
}

const built = JSON.parse(
  readFileSync(new URL('../dist/tokens.json', import.meta.url), 'utf8'),
) as Built;
const css = readFileSync(new URL('../dist/themes.css', import.meta.url), 'utf8');
const base = built.themes.default?.light ?? {};
const types = new Map(built.contract.map((t) => [t.name, t.type]));

/** `0.25rem` or `1px` in px, at a 16px root. */
function px(value: string | undefined): number {
  const m = /^([\d.]+)(rem|px)$/.exec(value ?? '');
  if (m === null) throw new Error(`not a length: ${String(value)}`);
  return Number(m[1]) * (m[2] === 'rem' ? 16 : 1);
}

/** The compact density block's own values. */
const compact = Object.fromEntries(
  [
    ...(/\[data-density="compact"\][^{]*\{([^}]*)\}/.exec(css)?.[1] ?? '').matchAll(
      /(--rx-[a-z0-9-]+): ([^;]+);/g,
    ),
  ].map((m) => [m[1] ?? '', m[2] ?? '']),
);

describe('skin contract', () => {
  it('ships every skin in src/skins, and only those', () => {
    const files = readdirSync(new URL('../src/skins', import.meta.url))
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
      .sort();
    expect(files).toEqual([...SKINS].sort());
    expect(Object.keys(built.skins).sort()).toEqual([...SKINS].sort());
  });

  it.each(SKINS)('%s overrides only contract tokens, never colour, shadow or motion', (skin) => {
    const tokens = built.skins[skin]?.tokens ?? {};
    expect(Object.keys(tokens).length).toBeGreaterThan(0);
    for (const name of Object.keys(tokens)) {
      expect(types.has(name), `${name} is not in the contract`).toBe(true);
      expect(types.get(name), name).not.toBe('color');
      expect(types.get(name), name).not.toBe('shadow');
      expect(name, name).not.toMatch(/^--rx-(motion|shadow)-/);
    }
  });

  it('rejects colour, shadow and motion tokens', () => {
    expect(skinViolation(['surface', 'default'], 'color')).toBeDefined();
    expect(skinViolation(['shadow', 'raised'], 'shadow')).toBeDefined();
    expect(skinViolation(['motion', 'duration', 'fast'], 'duration')).toBeDefined();
    expect(skinViolation(['component', 'field', 'background'], 'color')).toBeDefined();
    expect(skinViolation(['font', 'size', 'base'], 'dimension')).toBeUndefined();
    expect(skinViolation(['border', 'width'], 'dimension')).toBeUndefined();
    expect(skinViolation(['component', 'emphasis', 'style'], 'other')).toBeUndefined();
  });

  it.each(SKINS)('%s keeps every touch target', (skin) => {
    const touch = Object.keys(built.skins[skin]?.tokens ?? {}).filter((n) => n.includes('touch'));
    expect(touch).toEqual([]);
  });

  it('rejects touch heights, allows layout measures', () => {
    expect(skinViolation(['control', 'height', 'touch'], 'dimension')).toBeDefined();
    expect(skinViolation(['component', 'button', 'height', 'touch'], 'dimension')).toBeDefined();
    expect(skinViolation(['component', 'tree', 'row-height-touch'], 'dimension')).toBeDefined();
    expect(skinViolation(['component', 'tree', 'row-height'], 'dimension')).toBeUndefined();
    expect(skinViolation(['component', 'tree', 'indent'], 'dimension')).toBeUndefined();
    expect(skinViolation(['component', 'alert-dialog', 'width'], 'dimension')).toBeUndefined();
    expect(skinViolation(['component', 'sheet', 'measure'], 'dimension')).toBeUndefined();
  });

  // Tokens that alias a control height follow a skin with no entry of their own.
  it.each(SKINS)('%s carries the tree row height through the control height', (skin) => {
    const light = built.skins[skin]?.themes.default?.light ?? {};
    expect(light['--rx-tree-row-height']).toBe('var(--rx-control-height-sm)');
    const own = built.skins[skin]?.tokens['--rx-control-height-sm'];
    expect(light['--rx-control-height-sm']).toBe(own ?? base['--rx-control-height-sm']);
  });
});

describe('skin css', () => {
  it.each(SKINS)('%s beats a theme on the same element and inside it', (skin) => {
    expect(css).toContain(
      `[data-skin="${skin}"],\n[data-skin="${skin}"][data-theme],\n[data-skin="${skin}"] [data-theme] {`,
    );
  });

  it('writes the skins after the themes and before compact density', () => {
    const lastTheme = css.lastIndexOf('[data-theme="default"]');
    const density = css.indexOf('[data-density="compact"]');
    for (const skin of SKINS) {
      const at = css.indexOf(`[data-skin="${skin}"]`);
      expect(at).toBeGreaterThan(lastTheme);
      expect(at).toBeLessThan(density);
    }
    // Compact applies on top of a skin on the same element or around it.
    expect(css).toContain('[data-density="compact"][data-skin]');
    expect(css).toContain('[data-density="compact"] [data-skin]');
  });

  it('redeclares the component tokens that alias what a skin changes', () => {
    const block = /\[data-skin="dense"\] \[data-theme\] \{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(block).toContain('--rx-button-height-md: var(--rx-control-height-md);');
    expect(block).toContain('--rx-field-radius: var(--rx-radius-control);');
    expect(block).toContain('--rx-tree-row-height: var(--rx-control-height-sm);');
  });
});

describe('dense', () => {
  const dense = built.skins.dense?.tokens ?? {};

  it('is smaller than the default theme in type, corners and controls', () => {
    for (const name of [
      '--rx-font-size-base',
      '--rx-font-size-sm',
      '--rx-radius-control',
      '--rx-radius-panel',
      '--rx-control-height-md',
      '--rx-space-unit',
    ])
      expect(px(dense[name]), name).toBeLessThan(px(base[name]));
  });

  // Dense sits beside compact density: compact inside a dense app must still tighten, never loosen.
  it('leaves room for compact density to tighten further', () => {
    for (const name of Object.keys(compact)) {
      if (dense[name] === undefined) continue;
      expect(px(compact[name]), name).toBeLessThanOrEqual(px(dense[name]));
    }
    expect(px(compact['--rx-space-unit'])).toBeLessThan(px(dense['--rx-space-unit']));
  });

  it('keeps body text at 12px or more', () => {
    expect(px(dense['--rx-font-size-sm'])).toBeGreaterThanOrEqual(12);
  });
});

describe('editorial', () => {
  const editorial = built.skins.editorial?.tokens ?? {};

  it('sets serif headings over the sans body', () => {
    expect(editorial['--rx-font-family-display']).toMatch(/^"IBM Plex Serif"/);
    expect(editorial['--rx-font-family-sans']).toBeUndefined();
  });

  it('draws hairline borders and restrained corners, with a more generous rhythm', () => {
    expect(px(editorial['--rx-border-width'])).toBeGreaterThan(0);
    expect(px(editorial['--rx-border-width'])).toBeLessThan(px(base['--rx-border-width']));
    expect(px(editorial['--rx-radius-panel'])).toBeLessThan(px(base['--rx-radius-panel']));
    expect(px(editorial['--rx-space-unit'])).toBeGreaterThan(px(base['--rx-space-unit']));
    expect(Number(editorial['--rx-font-line-height-base'])).toBeGreaterThan(
      Number(base['--rx-font-line-height-base']),
    );
  });

  it('loads the serif faces it uses', () => {
    const fonts = readFileSync(new URL('../src/fonts.css', import.meta.url), 'utf8');
    expect(fonts).toContain("@import '@fontsource/ibm-plex-serif/500.css';");
    expect(fonts).toContain("@import '@fontsource/ibm-plex-serif/400-italic.css';");
  });
});

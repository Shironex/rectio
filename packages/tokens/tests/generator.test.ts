import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  RANGES,
  ThemeCodeError,
  colorRoles,
  decodeTheme,
  encodeTheme,
  expandPairs,
  extractCode,
  generatorPresets,
  isThemeReference,
  pairsOf,
  passCount,
  renderThemeCss,
  resolveTheme,
  templateColors,
  type GeneratorData,
  type ThemeInputs,
} from '../generator/index.ts';

interface Built {
  themes: Record<string, Record<string, Record<string, string>>>;
}

const data = JSON.parse(
  readFileSync(new URL('../dist/generator.json', import.meta.url), 'utf8'),
) as GeneratorData;
const built = JSON.parse(
  readFileSync(new URL('../dist/tokens.json', import.meta.url), 'utf8'),
) as Built;

/** A template in the shape the registry ships: light, dark and system-dark blocks of the default. */
function template(): string {
  const light = built.themes.default?.light ?? {};
  const dark = built.themes.default?.dark ?? {};
  const decl = (indent: string, entries: [string, string][]) =>
    entries.map(([k, v]) => `${indent}${k}: ${v};`).join('\n');
  const changed = Object.entries(dark).filter(([k, v]) => light[k] !== v);
  return [
    '/* rectio theme "default". Generated from @rectio/tokens. Fonts: SIL Open Font License 1.1. */',
    '',
    "@import '@fontsource-variable/ibm-plex-sans/wght.css';",
    "@import '@fontsource/ibm-plex-mono/400.css';",
    "@import '@fontsource/ibm-plex-mono/500.css';",
    '',
    ':root,',
    '[data-theme="default"] {',
    '  color-scheme: light;',
    decl('  ', Object.entries(light)),
    '}',
    '',
    ':root:not([data-theme])[data-mode="dark"],',
    '[data-theme="default"][data-mode="dark"] {',
    '  color-scheme: dark;',
    decl('  ', changed),
    '}',
    '',
    '@media (prefers-color-scheme: dark) {',
    '  :root:not([data-theme]):not([data-mode]),',
    '  [data-theme="default"]:not([data-mode]) {',
    '    color-scheme: dark;',
    decl('    ', changed),
    '  }',
    '}',
    '',
  ].join('\n');
}

const TEMPLATE = template();
const shipped = templateColors(TEMPLATE);
const pairs = expandPairs(data.pairs);
const presets = generatorPresets(data.presets);
const graphite = presets.find((p) => p.id === 'graphite');
if (graphite === undefined) throw new Error('no graphite preset');

const failures = (inputs: ThemeInputs) => {
  const r = resolveTheme(inputs, pairs, shipped);
  return [...r.light.fails, ...r.dark.fails].map(
    (f) => `${f.fg} on ${f.bg} ${f.ratio.toFixed(2)} < ${String(f.min)}`,
  );
};

const withColor = (patch: Partial<ThemeInputs['color']>): ThemeInputs => ({
  ...structuredClone(graphite.inputs),
  color: { ...structuredClone(graphite.inputs.color), ...patch },
});

describe('generator data', () => {
  it('carries the derivation presets and the gated pairs', () => {
    expect(data.presets.map((p) => p.name)).toEqual(
      expect.arrayContaining(['graphite', 'ink', 'onyx', 'ledger-look']),
    );
    expect(data.pairs.length).toBeGreaterThan(100);
    expect(data.compact['--rx-control-height-md']).toBeDefined();
  });

  it('offers Default, Graphite, Ink, Onyx and Ledger', () => {
    expect(presets.map((p) => p.label)).toEqual(['Default', 'Graphite', 'Ink', 'Onyx', 'Ledger']);
  });
});

describe('theme code', () => {
  it.each(presets)('$label survives a round trip', ({ inputs }) => {
    const code = encodeTheme(inputs);
    expect(code).toMatch(/^1\.[A-Za-z0-9_-]+$/);
    expect(code.length).toBeLessThan(400);
    expect(encodeTheme(decodeTheme(code))).toBe(code);
  });

  it('keeps names, radius, density, fonts and overrides', () => {
    const inputs: ThemeInputs = {
      ...structuredClone(graphite.inputs),
      name: 'acme',
      radius: 'round',
      density: 'compact',
      fonts: {
        sans: 'schibsted',
        display: 'source-serif',
        mono: 'system-mono',
        numeric: 'plex-mono',
      },
      overrides: { light: { accent: 'oklch(50% 0.2 30)' }, dark: { text: 'oklch(90% 0 0 / 0.9)' } },
    };
    const back = decodeTheme(encodeTheme(inputs));
    expect(back.name).toBe('acme');
    expect(back.radius).toBe('round');
    expect(back.density).toBe('compact');
    expect(back.fonts).toEqual(inputs.fonts);
    expect(back.overrides).toEqual(inputs.overrides);
  });

  it('reads the code out of a share link, in the query or the hash', () => {
    const code = encodeTheme(graphite.inputs);
    expect(extractCode(`https://example.com/rectio/docs/theming/generator?theme=${code}`)).toBe(
      code,
    );
    expect(extractCode(`https://example.com/x#theme=${code}`)).toBe(code);
    expect(isThemeReference(`https://example.com/?theme=${code}`)).toBe(true);
    expect(isThemeReference(code)).toBe(true);
    expect(isThemeReference('button')).toBe(false);
  });

  const body = (value: unknown) => `1.${Buffer.from(JSON.stringify(value)).toString('base64url')}`;
  const base = { b: [263, 0.19], u: [75, 0.006], d: 0.175, m: 'll' };

  it.each([
    ['an unknown version', `2.${Buffer.from('{}').toString('base64url')}`, /version 2/],
    ['damaged JSON', '1.bm90IGpzb24', /damaged/],
    ['a depth out of range', body({ ...base, d: 0.5 }), /depth/],
    [
      'a font in the wrong role',
      body({ ...base, f: ['source-serif', 'plex-sans', 'plex-mono', 'plex-sans'] }),
      /sans font/,
    ],
    ['a name that is not an id', body({ ...base, n: '../etc' }), /name/],
    ['a bad override name', body({ ...base, x: { l: { 'a b': '50 0.1 20' } } }), /token name/],
    ['a link without a code', 'https://example.com/docs', /no theme code/],
  ])('refuses %s', (_what, code, message) => {
    expect(() => decodeTheme(code)).toThrow(ThemeCodeError);
    expect(() => decodeTheme(code)).toThrow(message);
  });
});

describe('derivation with correction', () => {
  it.each(presets)('$label passes every gated pair in both modes', ({ inputs }) => {
    expect(failures(inputs)).toEqual([]);
  });

  it('keeps an aggressive theme accessible: a neon brand on a very deep dark', () => {
    const neon = withColor({
      brand: { hue: 142, chroma: 0.3 },
      neutral: { hue: 300, chroma: 0.03 },
      depth: 0.11,
      steps: [0, 0.005, 0.01, 0.015],
      text: 0.88,
      solids: { light: 'light', dark: 'light' },
      accentL: 0.9,
      selectedChroma: 0.05,
    });
    const r = resolveTheme(neon, pairs, shipped);
    expect(r.light.corrections.length + r.dark.corrections.length).toBeGreaterThan(0);
    expect(failures(neon)).toEqual([]);
  });

  // A spread of inputs across every range: correction must leave no gated pair failing.
  it('keeps every theme across the input ranges accessible', () => {
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const pick = ([lo, hi]: readonly [number, number]) => lo + (hi - lo) * rand();
    const found: string[] = [];
    for (let i = 0; i < 60; i += 1) {
      const inputs = withColor({
        brand: { hue: pick(RANGES.hue), chroma: pick(RANGES.brandChroma) },
        neutral: { hue: pick(RANGES.hue), chroma: pick(RANGES.neutralChroma) },
        depth: pick(RANGES.depth),
        text: pick(RANGES.text),
        solids: { light: rand() > 0.7 ? 'ink' : 'light', dark: rand() > 0.5 ? 'dark' : 'light' },
        selectedChroma: pick(RANGES.selectedChroma),
      });
      found.push(...failures(inputs).map((f) => `${encodeTheme(inputs)}: ${f}`));
    }
    expect(found).toEqual([]);
  }, 30_000);

  it('keeps an override that breaks AA, and reports it', () => {
    const inputs = structuredClone(graphite.inputs);
    inputs.overrides.light['text-muted'] = 'oklch(80% 0 0)';
    const r = resolveTheme(inputs, pairs, shipped);
    expect(r.light.tokens['--rx-text-muted']).toBe('oklch(80% 0 0)');
    expect(r.light.overridden).toEqual(['text-muted']);
    expect(r.light.fails.some((f) => f.fg === 'text-muted')).toBe(true);
    expect(
      pairsOf(r.light, 'text-muted').every((p) => p.fg === 'text-muted' || p.bg === 'text-muted'),
    ).toBe(true);
    expect(passCount(r.light).pass).toBeLessThan(passCount(r.light).total);
  });

  it('keeps the shipped light colours for Default', () => {
    const def = presets.find((p) => p.id === 'default');
    if (def === undefined) throw new Error('no default preset');
    const r = resolveTheme(def.inputs, pairs, shipped);
    const moved = new Set(r.light.corrections.map((c) => `--rx-${c.token}`));
    const kept = colorRoles().filter((role) => !moved.has(role));
    expect(kept.length).toBeGreaterThan(80);
    expect(kept.map((role) => r.light.tokens[role])).toEqual(
      kept.map((role) => shipped.light[role]),
    );
  });
});

describe('theme css', () => {
  const resolved = resolveTheme(graphite.inputs, pairs, shipped);

  it('keeps the template shape: same blocks, the new id, every colour', () => {
    const css = renderThemeCss(TEMPLATE, graphite.inputs, resolved, data.compact);
    expect(css).toContain('[data-theme="custom"] {');
    expect(css).toContain('[data-theme="custom"][data-mode="dark"] {');
    expect(css).not.toContain('[data-theme="default"]');
    expect(css).toContain(`theme code ${encodeTheme(graphite.inputs)}`);
    for (const [name, value] of Object.entries(resolved.light.tokens))
      expect(css).toContain(`  ${name}: ${value};`);
    for (const [name, value] of Object.entries(resolved.dark.tokens))
      expect(css).toContain(`${name}: ${value};`);
  });

  it('writes radius, density and fonts into the light block', () => {
    const inputs: ThemeInputs = {
      ...structuredClone(graphite.inputs),
      radius: 'round',
      density: 'compact',
      fonts: {
        sans: 'schibsted',
        display: 'source-serif',
        mono: 'plex-mono',
        numeric: 'plex-sans',
      },
    };
    const css = renderThemeCss(
      TEMPLATE,
      inputs,
      resolveTheme(inputs, pairs, shipped),
      data.compact,
    );
    expect(css).toContain('--rx-radius-panel: 1rem;');
    expect(css).toContain(
      `--rx-control-height-md: ${data.compact['--rx-control-height-md'] ?? ''};`,
    );
    expect(css).toContain('--rx-font-family-sans: "Schibsted Grotesk Variable"');
    expect(css).toContain("@import '@fontsource-variable/source-serif-4/opsz.css';");
    expect(css).not.toContain(
      "@import '@fontsource/ibm-plex-mono/400.css';\n@import '@fontsource/ibm-plex-mono/400.css'",
    );
  });

  it('scopes the preview CSS: no imports, no :root', () => {
    const css = renderThemeCss(TEMPLATE, graphite.inputs, resolved, data.compact, {
      scoped: true,
      id: 'preview',
    });
    expect(css).not.toContain('@import');
    expect(css).not.toContain(':root');
    expect(css).toContain('[data-theme="preview"]:not([data-mode])');
  });

  it('writes the same CSS for the same code', () => {
    const again = decodeTheme(encodeTheme(graphite.inputs));
    expect(renderThemeCss(TEMPLATE, again, resolveTheme(again, pairs, shipped), data.compact)).toBe(
      renderThemeCss(TEMPLATE, graphite.inputs, resolved, data.compact),
    );
  });
});

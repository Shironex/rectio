import { readFileSync, readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { contrast } from '../scripts/color.ts';
import { derivePairs, parseOklch, toSrgb } from '../scripts/contrast.ts';
import { NO_SKIN, SKINS, TRANSLUCENT, isClearShadow, skinViolation } from '../scripts/naming.ts';

interface Built {
  contract: { name: string; type: string }[];
  themes: Record<string, Record<string, Record<string, string>>>;
  skins: Record<
    string,
    {
      tokens: Record<string, string>;
      translucent: Record<string, string>;
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
    const all = readdirSync(new URL('../src/skins', import.meta.url)).filter((f) =>
      f.endsWith('.json'),
    );
    const layers = all.filter((f) => f.endsWith(`.${TRANSLUCENT}.json`));
    const files = all
      .filter((f) => !layers.includes(f))
      .map((f) => f.replace(/\.json$/, ''))
      .sort();
    expect(files).toEqual([...SKINS].sort());
    // A translucent layer always belongs to a shipped skin.
    for (const layer of layers) expect(SKINS).toContain(layer.split('.')[0]);
    expect(Object.keys(built.skins).sort()).toEqual([...SKINS].sort());
    expect(SKINS).not.toContain(NO_SKIN);
  });

  it.each(SKINS)('%s overrides only contract tokens, never colour or motion', (skin) => {
    const tokens = built.skins[skin]?.tokens ?? {};
    const translucent = built.skins[skin]?.translucent ?? {};
    expect(Object.keys(tokens).length).toBeGreaterThan(0);
    for (const name of Object.keys({ ...tokens, ...translucent })) {
      expect(types.has(name), `${name} is not in the contract`).toBe(true);
      expect(types.get(name), name).not.toBe('color');
      expect(name, name).not.toMatch(/^--rx-motion-/);
    }
    // A skin may clear the theme's soft shadow, never draw one in a colour of its own.
    const shadows = Object.entries(tokens).filter(([name]) => types.get(name) === 'shadow');
    expect(shadows.filter(([, value]) => !isClearShadow(value))).toEqual([]);
  });

  it('rejects colour, drawn shadows and motion tokens', () => {
    expect(skinViolation(['surface', 'default'], 'color')).toBeDefined();
    expect(
      skinViolation(['shadow', 'raised'], 'shadow', '0px 1px 2px 0px oklch(30% 0 0 / 0.1)'),
    ).toBeDefined();
    expect(skinViolation(['shadow', 'offset', 'color'], 'color')).toBeDefined();
    expect(skinViolation(['border', 'highlight'], 'color')).toBeDefined();
    expect(skinViolation(['motion', 'duration', 'fast'], 'duration')).toBeDefined();
    expect(skinViolation(['component', 'field', 'background'], 'color')).toBeDefined();
    expect(skinViolation(['font', 'size', 'base'], 'dimension')).toBeUndefined();
    expect(skinViolation(['border', 'width'], 'dimension')).toBeUndefined();
    expect(skinViolation(['border', 'ink'], 'number')).toBeUndefined();
    expect(skinViolation(['shadow', 'offset', 'raised'], 'dimension')).toBeUndefined();
    expect(skinViolation(['shadow', 'highlight'], 'dimension')).toBeUndefined();
    expect(
      skinViolation(['shadow', 'raised'], 'shadow', '0px 0px 0px 0px oklch(0% 0 0 / 0)'),
    ).toBeUndefined();
    expect(skinViolation(['component', 'emphasis', 'style'], 'other')).toBeUndefined();
  });

  // The solid layer is the fallback, so only the translucent layer may let the backdrop through.
  it('keeps surfaces solid outside a translucent layer, and the layer to its own tokens', () => {
    expect(skinViolation(['surface', 'opacity'], 'number')).toBeDefined();
    expect(skinViolation(['surface', 'backdrop'], 'other')).toBeDefined();
    expect(skinViolation(['surface', 'opacity'], 'number', '0.8', 'translucent')).toBeUndefined();
    expect(
      skinViolation(['surface', 'backdrop'], 'other', 'blur(4px)', 'translucent'),
    ).toBeUndefined();
    expect(skinViolation(['radius', 'panel'], 'dimension', '1rem', 'translucent')).toBeDefined();
    for (const skin of SKINS) {
      expect(built.skins[skin]?.tokens['--rx-surface-opacity'], skin).toBeUndefined();
      expect(built.skins[skin]?.tokens['--rx-surface-backdrop'], skin).toBeUndefined();
    }
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
  it.each(SKINS)(
    '%s beats a theme on the same element, and a theme inside takes it back',
    (skin) => {
      expect(css).toContain(`[data-skin="${skin}"],\n[data-skin="${skin}"][data-theme] {`);
      // A theme inside the skin takes every skin token back from its parent: the nearest skin wins.
      const inside = new RegExp(
        `\\[data-skin="${skin}"\\] :where\\(\\[data-theme\\]:not\\(\\[data-skin\\]\\)\\) \\{([^}]*)\\}`,
      ).exec(css)?.[1];
      for (const name of Object.keys(built.skins[skin]?.tokens ?? {}))
        expect(inside, name).toContain(`${name}: inherit;`);
      // Component tokens that read the skin's tokens are left to the inner theme rule, which
      // resolves them in its own mode: a dark scope keeps dark shadow colours.
      expect(inside).not.toMatch(/--rx-(button|dialog|popover|toast|sheet)-/);
    },
  );

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
    const block = /\[data-skin="dense"\]\[data-theme\] \{([^}]*)\}/.exec(css)?.[1] ?? '';
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

  it('keeps every text size at 12px or more', () => {
    expect(px(dense['--rx-font-size-xs'])).toBeGreaterThanOrEqual(12);
    expect(px(dense['--rx-font-size-sm'])).toBeGreaterThanOrEqual(12);
  });
});

describe('editorial', () => {
  const editorial = built.skins.editorial?.tokens ?? {};

  it('sets serif headings over the sans body', () => {
    expect(editorial['--rx-font-family-display']).toMatch(/^"IBM Plex Serif"/);
    expect(editorial['--rx-font-family-sans']).toBeUndefined();
  });

  // A hairline rounds up to 1px on a 1x screen, so the serif amounts carry the look there.
  it('sets amounts in the serif', () => {
    expect(editorial['--rx-money-family']).toBe('var(--rx-font-family-display)');
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

/** Gamma sRGB to WCAG relative luminance. */
const lum = (rgb: readonly number[]) => {
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(rgb[0] ?? 0) + 0.7152 * lin(rgb[1] ?? 0) + 0.0722 * lin(rgb[2] ?? 0);
};
const ratio = (a: readonly number[], b: readonly number[]) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
/** `top` at `alpha` over an opaque `bottom`, in gamma sRGB as browsers blend. */
const over = (top: readonly number[], alpha: number, bottom: readonly number[]) =>
  top.map((v, i) => alpha * v + (1 - alpha) * (bottom[i] ?? 0));
const rgb = (tokens: Record<string, string>, name: string) => {
  const color = parseOklch(tokens[`--rx-${name}`]);
  if (color === undefined) throw new Error(`${name} is not a colour`);
  return toSrgb(color);
};

describe('glass', () => {
  const glass = built.skins.glass?.tokens ?? {};
  const layer = built.skins.glass?.translucent ?? {};
  const opacity = Number(layer['--rx-surface-opacity']);
  /** The fills `backdrop-surface` lets through: they mix toward transparent by the opacity. */
  const FLOATING = ['surface', 'surface-canvas', 'surface-raised', 'surface-overlay'];
  /** The page surfaces a pane floats over in an app: the backdrop the layer is tuned for. */
  const PAGE = [
    'surface',
    'surface-canvas',
    'surface-raised',
    'surface-sunken',
    'surface-overlay',
    'surface-hover',
    'surface-inset',
    'surface-selected',
  ];
  const pairs = derivePairs().filter(
    (p) => p.gate !== 'info' && p.bgAlpha === 1 && FLOATING.includes(p.bg),
  );
  const modes = Object.entries(built.themes).flatMap(([theme, byMode]) =>
    Object.entries(byMode).map(([mode, tokens]) => ({ key: `${theme}/${mode}`, tokens })),
  );

  it('is solid with rounder corners and an edge highlight, translucent only in its layer', () => {
    expect(px(glass['--rx-radius-panel'])).toBeGreaterThan(px(base['--rx-radius-panel']));
    expect(px(glass['--rx-shadow-highlight'])).toBeGreaterThan(0);
    expect(opacity).toBeGreaterThan(0.5);
    expect(opacity).toBeLessThan(1);
    expect(layer['--rx-surface-backdrop']).toContain('blur(var(--rx-surface-blur))');
  });

  // The solid layer is what the contrast and colour vision suites in themes.test.ts hold to every
  // pair. On top of that, the translucent layer over its assumed backdrop:
  it.each(modes)('$key holds every pair on glass over each page surface', ({ tokens }) => {
    const failures = pairs.flatMap((p) =>
      PAGE.flatMap((backdrop) => {
        const bg = over(rgb(tokens, p.bg), opacity, rgb(tokens, backdrop));
        const fgColor = parseOklch(tokens[`--rx-${p.fg}`]);
        if (fgColor === undefined) return [];
        const a = p.fgAlpha * (fgColor.alpha ?? 1);
        const fg = a < 1 ? over(toSrgb(fgColor), a, bg) : toSrgb(fgColor);
        const r = ratio(fg, bg);
        return r >= p.min ? [] : [`${p.fg} on ${p.bg} over ${backdrop}: ${r.toFixed(2)}`];
      }),
    );
    expect([...new Set(failures)]).toEqual([]);
  });

  // And over the worst backdrop there is, for the text people read.
  it.each(modes)('$key keeps body and muted text at 4.5:1 over black and white', ({ tokens }) => {
    const failures = ['text', 'text-muted'].flatMap((fg) =>
      FLOATING.flatMap((bg) =>
        [
          [0, 0, 0],
          [1, 1, 1],
        ].flatMap((backdrop) => {
          const r = ratio(rgb(tokens, fg), over(rgb(tokens, bg), opacity, backdrop));
          return r >= 4.5 ? [] : [`${fg} on ${bg} over ${backdrop.join(',')}: ${r.toFixed(2)}`];
        }),
      ),
    );
    expect(failures).toEqual([]);
  });

  it('turns translucent only where the backdrop blurs, and solid again on request', () => {
    const supports = css.indexOf(
      '@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {\n  [data-skin="glass"]',
    );
    const reduced = css.indexOf(
      '@media (prefers-reduced-transparency: reduce) {\n  [data-skin="glass"]',
    );
    expect(supports).toBeGreaterThan(css.indexOf('/* Skin "glass": '));
    // Same weight, written later: the request for less transparency wins.
    expect(reduced).toBeGreaterThan(supports);
    const restore = css.slice(reduced, css.indexOf('}', reduced));
    expect(restore).toContain('--rx-surface-opacity: 1;');
    expect(restore).toContain('--rx-surface-backdrop: none;');
    // Nothing outside the layer makes a surface see-through.
    const solid = /\[data-skin="glass"\]\[data-theme\] \{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(solid).not.toContain('--rx-surface-opacity');
  });

  it('carries the highlight into the popup, dialog, sheet and toast shadows', () => {
    const block = /\[data-skin="glass"\]\[data-theme\] \{([^}]*)\}/.exec(css)?.[1] ?? '';
    for (const part of ['popover', 'dialog', 'sheet', 'toast'])
      expect(block).toContain(`--rx-${part}-shadow: inset 0 var(--rx-shadow-highlight, 0px)`);
  });
});

describe('brutalist', () => {
  const brutalist = built.skins.brutalist?.tokens ?? {};

  it('draws square corners, heavy ink borders and hard offset shadows, with no soft blur', () => {
    for (const name of ['--rx-radius-control', '--rx-radius-panel', '--rx-radius-badge'])
      expect(px(brutalist[name]), name).toBe(0);
    expect(px(brutalist['--rx-border-width'])).toBeGreaterThan(px(base['--rx-border-width']));
    expect(Number(brutalist['--rx-border-ink'])).toBe(1);
    expect(px(brutalist['--rx-shadow-offset-raised'])).toBeGreaterThan(0);
    expect(px(brutalist['--rx-shadow-offset-overlay'])).toBeGreaterThan(
      px(brutalist['--rx-shadow-offset-raised']),
    );
    expect(isClearShadow(brutalist['--rx-shadow-raised'] ?? '')).toBe(true);
    expect(isClearShadow(brutalist['--rx-shadow-overlay'] ?? '')).toBe(true);
  });

  it('sets heavier type', () => {
    for (const w of ['regular', 'medium', 'strong', 'heading'])
      expect(Number(brutalist[`--rx-font-weight-${w}`]), w).toBeGreaterThan(
        Number(base[`--rx-font-weight-${w}`]),
      );
  });

  // Outlines paint over the element's own shadow; where a ring crosses the offset block it must
  // still read, and the block must read on the canvas (WCAG 1.4.11 for the ring, a visible cue for
  // the block).
  it.each(['light', 'dark'])('keeps a focus ring clear of the offset shadow in %s', (mode) => {
    const t = built.themes.default?.[mode] ?? {};
    const c = (a: string, b: string) => {
      const x = parseOklch(t[`--rx-${a}`]);
      const y = parseOklch(t[`--rx-${b}`]);
      if (x === undefined || y === undefined) throw new Error(`${a} or ${b} missing`);
      return contrast(x, y);
    };
    expect(c('focus', 'shadow-offset-color')).toBeGreaterThanOrEqual(3);
    expect(c('focus', 'surface-canvas')).toBeGreaterThanOrEqual(3);
    expect(c('shadow-offset-color', 'surface-canvas')).toBeGreaterThanOrEqual(2);
  });
});

describe('the switches a skin turns on', () => {
  const tailwind = readFileSync(new URL('../dist/tailwind.css', import.meta.url), 'utf8');

  it('are off in every theme: solid surfaces, theme borders, only the soft shadow', () => {
    for (const modes of Object.values(built.themes))
      for (const tokens of Object.values(modes)) {
        expect(tokens['--rx-surface-opacity']).toBe('1');
        expect(tokens['--rx-surface-backdrop']).toBe('none');
        expect(tokens['--rx-border-ink']).toBe('0');
        expect(px(tokens['--rx-shadow-highlight'])).toBe(0);
        expect(px(tokens['--rx-shadow-offset-raised'])).toBe(0);
        expect(px(tokens['--rx-shadow-offset-overlay'])).toBe(0);
      }
  });

  // Resolved where they are used, with fallbacks for a theme file written before the switches.
  it('reach the utilities inline, falling back to the theme as drawn', () => {
    expect(tailwind).toContain(
      '--color-surface-raised: color-mix(in oklab, var(--rx-surface-raised) calc(var(--rx-surface-alpha, 1) * 100%), transparent);',
    );
    expect(tailwind).toContain(
      '--color-line: color-mix(in oklab, var(--rx-text) calc(var(--rx-border-ink, 0) * 100%), var(--rx-border));',
    );
    expect(tailwind).toContain(
      '--shadow-raised: inset 0 var(--rx-shadow-highlight, 0px) 0 0 var(--rx-border-highlight, transparent), var(--rx-shadow-offset-raised, 0px) var(--rx-shadow-offset-raised, 0px) 0 0 var(--rx-shadow-offset-color, transparent), var(--rx-shadow-raised);',
    );
    // Only the element that blurs its backdrop turns see-through; its children stay solid.
    expect(tailwind).toMatch(/@property --rx-surface-alpha \{[^}]*inherits: false;/);
    expect(tailwind).toContain('@utility backdrop-surface {');
    expect(tailwind).toContain('backdrop-filter: var(--rx-surface-backdrop, none);');
  });
});

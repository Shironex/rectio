/**
 * Builds the token package: DTCG JSON in src/ to CSS variables (dist/themes.css), a Tailwind v4
 * stylesheet (dist/tailwind.css), resolved values (dist/tokens.json) and font faces (dist/fonts.css).
 *
 * Style Dictionary reads, merges and resolves the DTCG sources; the value transforms below turn
 * DTCG 2025.10 value objects into CSS, and this script assembles the selectors.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import StyleDictionary from 'style-dictionary';
import type { TransformedToken } from 'style-dictionary/types';

import {
  COLOR_GROUPS,
  MODES,
  PRIMITIVE_GROUPS,
  NO_SKIN,
  SKINS,
  THEMES,
  cssVarName,
  skinViolation,
  tailwindColorName,
  type Mode,
  type Theme,
} from './naming.ts';
import { cssValue } from './values.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (path: string) => join(root, 'src', path);
const dist = join(root, 'dist');

StyleDictionary.registerTransform({
  name: 'rx/value',
  type: 'value',
  transitive: true,
  transform: (token: TransformedToken) => cssValue(token.$value, token.$type),
});

type TokenMap = Map<string, { value: string; type: string }>;
const emptyTokens = (): TokenMap => new Map<string, { value: string; type: string }>();
const plain = (tokens: TokenMap) =>
  Object.fromEntries([...tokens].map(([name, { value }]) => [name, value]));

async function resolve(
  sources: string[],
  onlyFrom?: string,
  check?: (path: string[], type: string) => void,
): Promise<TokenMap> {
  const sd = new StyleDictionary({
    source: sources,
    usesDtcg: true,
    log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: { css: { transforms: ['rx/value'] } },
  });
  const { allTokens } = await sd.getPlatformTokens('css');
  const out: TokenMap = new Map();
  for (const token of allTokens) {
    if (PRIMITIVE_GROUPS.has(token.path[0] ?? '')) continue;
    if (onlyFrom !== undefined && token.filePath !== onlyFrom) continue;
    const type = token.$type;
    if (type === undefined) throw new Error(`${token.path.join('.')} has no $type`);
    check?.(token.path, type);
    out.set(cssVarName(token.path), { value: componentValue(token) ?? String(token.$value), type });
  }
  return out;
}

/** A component token aliasing a semantic token stays a live var() so it follows the theme. */
function componentValue(token: TransformedToken): string | undefined {
  if (token.path[0] !== 'component') return undefined;
  const original: unknown = token.original.$value;
  const alias = typeof original === 'string' ? /^\{([^}]+)\}$/.exec(original) : null;
  const target = alias?.[1]?.split('.');
  if (target === undefined || PRIMITIVE_GROUPS.has(target[0] ?? '')) return undefined;
  return `var(${cssVarName(target)})`;
}

function themeSources(theme: Theme, mode: Mode): string[] {
  const optional = src(`themes/${theme}/components.json`);
  return [
    src('primitives/*.json'),
    src(`themes/${theme}/base.json`),
    src(`themes/${theme}/${mode}.json`),
    src('components.json'),
    ...(existsSync(optional) ? [optional] : []),
  ];
}

function skinSources(theme: Theme, mode: Mode, skin: string): string[] {
  return [...themeSources(theme, mode), src(`skins/${skin}.json`)];
}

/** A skin's own tokens, each checked against the skin contract in naming.ts. */
async function resolveSkin(skin: string): Promise<TokenMap> {
  const file = src(`skins/${skin}.json`);
  const problems: string[] = [];
  const tokens = await resolve(skinSources('default', 'light', skin), file, (path, type) => {
    const why = skinViolation(path, type);
    if (why !== undefined) problems.push(`${path.join('.')} (${why})`);
  });
  if (problems.length > 0)
    throw new Error(`skin "${skin}" breaks the skin contract:\n  ${problems.join('\n  ')}`);
  if (tokens.size === 0) throw new Error(`skin "${skin}" overrides nothing`);
  return tokens;
}

/** Every theme and mode must define exactly the token set of default/light: it is the contract. */
function checkContract(resolved: Map<string, TokenMap>): string[] {
  const contract = resolved.get('default/light');
  if (contract === undefined) throw new Error('default/light is missing');
  const names = [...contract.keys()].sort();
  const problems: string[] = [];
  for (const [key, tokens] of resolved) {
    for (const name of names) if (!tokens.has(name)) problems.push(`${key} is missing ${name}`);
    for (const name of tokens.keys()) if (!contract.has(name)) problems.push(`${key} adds ${name}`);
  }
  if (problems.length > 0) throw new Error(`token contract broken:\n  ${problems.join('\n  ')}`);
  return names;
}

const block = (selectors: string[], decls: string[], indent = '') =>
  `${indent}${selectors.join(`,\n${indent}`)} {\n${decls.map((d) => `${indent}  ${d}`).join('\n')}\n${indent}}`;

const declarations = (tokens: TokenMap, filter?: (name: string) => boolean) =>
  [...tokens]
    .filter(([name]) => filter?.(name) ?? true)
    .map(([name, { value }]) => `${name}: ${value};`);

function selectorsFor(theme: Theme) {
  const isDefault = theme === 'default';
  return {
    light: isDefault ? [':root', '[data-theme="default"]'] : [`[data-theme="${theme}"]`],
    dark: isDefault
      ? [':root:not([data-theme])[data-mode="dark"]', '[data-theme="default"][data-mode="dark"]']
      : [`[data-theme="${theme}"][data-mode="dark"]`],
    auto: isDefault
      ? [':root:not([data-theme]):not([data-mode])', '[data-theme="default"]:not([data-mode])']
      : [`[data-theme="${theme}"]:not([data-mode])`],
  };
}

/**
 * Selectors of a skin. A skin beats a theme on the same element, and is written after the themes so
 * it also beats `:root`.
 */
const skinSelectors = (skin: string) => [
  `[data-skin="${skin}"]`,
  `[data-skin="${skin}"][data-theme]`,
];

/**
 * A theme inside a skin, with no skin of its own: its theme rule sets every token again, so it takes
 * the skin's tokens back from its parent with `inherit`. Inheritance reaches the nearest skin around
 * it at any depth, so when skins nest the closest one wins whatever order the rules are written in.
 * `:where` keeps the weight of one attribute, so compact density, written later and heavier, still
 * applies on top. `data-skin="none"` names no skin, so it stops an outer skin and leaves the theme's
 * own values.
 */
const skinInsideSelector = (skin: string) =>
  `[data-skin="${skin}"] :where([data-theme]:not([data-skin]))`;

/** Compact density, written after the skins: it applies on top of any skin, inside or around it. */
const DENSITY_SELECTORS = [
  '[data-density="compact"]',
  '[data-density="compact"][data-theme]',
  '[data-density="compact"][data-skin]',
  '[data-density="compact"] [data-theme]',
  '[data-density="compact"] [data-skin]',
];

/** Component tokens that alias one of `names`: a scope that changes those must redeclare them. */
function aliasesOf(base: TokenMap, names: ReadonlySet<string>): TokenMap {
  return new Map(
    [...base].filter(([name, { value }]) => {
      const target = /^var\((--rx-[a-z0-9-]+)\)$/.exec(value)?.[1];
      return target !== undefined && names.has(target) && !names.has(name);
    }),
  );
}

function themesCss(
  resolved: Map<string, TokenMap>,
  skins: Map<string, TokenMap>,
  compact: TokenMap,
  reduced: TokenMap,
): string {
  const parts: string[] = [];
  // A density scope nested inside a theme must redeclare the component tokens that read a density
  // token: a custom property inherits its resolved value, so the theme's sizes would otherwise win.
  const base: TokenMap = resolved.get('default/light') ?? emptyTokens();
  const componentRefs: TokenMap = new Map(
    [...base].filter(([, { value }]) => /^var\(--rx-(control|space)-/.test(value)),
  );
  const auto: string[] = [];
  for (const theme of THEMES) {
    const light = resolved.get(`${theme}/light`);
    const dark = resolved.get(`${theme}/dark`);
    if (light === undefined || dark === undefined) throw new Error(`${theme} is incomplete`);
    const changed = (name: string) => dark.get(name)?.value !== light.get(name)?.value;
    const selectors = selectorsFor(theme);
    parts.push(block(selectors.light, ['color-scheme: light;', ...declarations(light)]));
    const darkDecls = ['color-scheme: dark;', ...declarations(dark, changed)];
    parts.push(block(selectors.dark, darkDecls));
    auto.push(block(selectors.auto, darkDecls, '  '));
  }
  parts.push(
    `/* No data-mode: follow the system. */\n@media (prefers-color-scheme: dark) {\n${auto.join('\n')}\n}`,
  );
  for (const [skin, tokens] of skins) {
    const refs = aliasesOf(base, new Set(tokens.keys()));
    parts.push(
      `/* Skin "${skin}": data-skin="${skin}" on any element. */\n${block(skinSelectors(skin), [
        ...declarations(tokens),
        ...declarations(refs),
      ])}`,
      block(
        [skinInsideSelector(skin)],
        [...tokens.keys(), ...refs.keys()].map((name) => `${name}: inherit;`),
      ),
    );
  }
  parts.push(block(DENSITY_SELECTORS, [...declarations(compact), ...declarations(componentRefs)]));
  parts.push(
    `@media (prefers-reduced-motion: reduce) {\n${block([':root', '[data-theme]'], declarations(reduced), '  ')}\n}`,
  );
  return `${HEADER}\n${parts.join('\n\n')}\n`;
}

const HEADER = '/* Generated by @rectio/tokens from the DTCG sources in src/. Do not edit. */';

/** Tailwind v4 entry: resets the default theme, then maps every utility to a token. */
function tailwindCss(contract: string[], types: TokenMap): string {
  const resets = [
    '--color-*',
    '--font-*',
    '--text-*',
    '--font-weight-*',
    '--tracking-*',
    '--leading-*',
    '--radius-*',
    '--shadow-*',
    '--inset-shadow-*',
    '--drop-shadow-*',
    '--text-shadow-*',
    '--ease-*',
    '--animate-*',
  ].map((name) => `${name}: initial;`);

  const map: string[] = [];
  const add = (key: string, varName: string) => {
    map.push(`${key}: var(${varName});`);
  };
  for (const name of contract) {
    const path = name.slice('--rx-'.length).split('-');
    const type = types.get(name)?.type;
    if (type === 'color' && COLOR_GROUPS.has(path[0] ?? ''))
      add(`--color-${tailwindColorName(path)}`, name);
  }
  for (const role of ['sans', 'display', 'mono', 'numeric'])
    add(`--font-${role}`, `--rx-font-family-${role}`);
  for (const size of ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl']) {
    add(`--text-${size}`, `--rx-font-size-${size}`);
    add(`--text-${size}--line-height`, `--rx-font-line-height-${size}`);
  }
  for (const weight of ['regular', 'medium', 'strong', 'heading']) {
    add(`--font-weight-${weight}`, `--rx-font-weight-${weight}`);
  }
  for (const tracking of ['tight', 'normal', 'caps'])
    add(`--tracking-${tracking}`, `--rx-font-tracking-${tracking}`);
  for (const radius of ['control', 'panel', 'badge', 'full'])
    add(`--radius-${radius}`, `--rx-radius-${radius}`);
  for (const shadow of ['raised', 'overlay']) add(`--shadow-${shadow}`, `--rx-shadow-${shadow}`);
  for (const ease of ['standard', 'enter', 'exit'])
    add(`--ease-${ease}`, `--rx-motion-easing-${ease}`);
  add('--spacing', '--rx-space-unit');
  // `border` and `divide` without a width read this. The fallback keeps a theme file written
  // before the token existed at one pixel.
  map.push('--default-border-width: var(--rx-border-width, 1px);');

  // Looping indicators. Each cycle is a multiple of a token, so a theme with slower motion slows
  // every loader together. Components switch to `animate-breathe` (a fade in place) under reduced
  // motion, so nothing travels or turns for people who asked for stillness.
  const loop = 'var(--rx-motion-duration-loop)';
  const standard = 'var(--rx-motion-easing-standard)';
  for (const [name, value] of [
    ['spin', `rx-spin ${loop} linear infinite`],
    ['orbit', `rx-spin calc(${loop} * 1.6) linear infinite`],
    ['arc', `rx-arc calc(${loop} * 1.6) ${standard} infinite`],
    ['dot', `rx-dot calc(${loop} * 1.4) ${standard} infinite`],
    ['bar', `rx-bar calc(${loop} * 1.2) ${standard} infinite`],
    ['ripple', `rx-ripple calc(${loop} * 2) var(--rx-motion-easing-enter) infinite`],
    ['breathe', `rx-breathe var(--rx-motion-duration-breathe) ${standard} infinite`],
    ['shimmer', `rx-shimmer var(--rx-motion-duration-shimmer) ${standard} infinite`],
    ['indeterminate', `rx-indeterminate calc(${loop} * 1.8) ${standard} infinite`],
  ])
    map.push(`--animate-${name}: ${value};`);
  map.push('--animate-marquee: rx-marquee var(--rx-motion-duration-marquee) linear infinite;');

  const durations = ['fast', 'base', 'slow', 'reveal'].map(
    (d) => `@utility duration-${d} {\n  transition-duration: var(--rx-motion-duration-${d});\n}`,
  );
  const playback = `/* Playback of a looping animation, such as a marquee that stops on hover or runs backwards. */
@utility playback-paused {
  animation-play-state: paused;
}

@utility playback-reverse {
  animation-direction: reverse;
}

/* The stressed phrase in a headline: a heavier weight, or italic where the theme's display face has no weight to spare. */
@utility emphasis {
  font-weight: var(--rx-emphasis-weight);
  font-style: var(--rx-emphasis-style);
}`;
  const numeric = `/* Money and quantities: the numeric family with tabular, lining figures. */
@utility numeric {
  font-family: var(--rx-font-family-numeric);
  font-variant-numeric: tabular-nums lining-nums;
}`;

  const sheet = `/* The parts of a full screen sheet: full bleed, their content in a centred column of the sheet measure. */
@utility px-sheet {
  padding-inline: max(calc(var(--spacing) * 5), calc((100% - var(--rx-sheet-measure)) / 2));
}

/* The same, with the end kept clear of the close button in the corner. */
@utility pe-sheet-close {
  padding-inline-end: max(calc(var(--spacing) * 14), calc((100% - var(--rx-sheet-measure)) / 2));
}`;

  const scrollbar = `/* A row that scrolls sideways without a bar, such as filter tabs on a phone. */
@utility scrollbar-none {
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}`;

  return `${HEADER}
@import './themes.css';

/* dark: follows data-mode. Components never need it: dark is solved in the tokens. */
@custom-variant dark (&:where([data-mode="dark"], [data-mode="dark"] *));

/* Drop Tailwind's default palette, type, radii, shadows and easings: only tokens remain. */
@theme {
${resets.map((r) => `  ${r}`).join('\n')}

  @keyframes rx-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* The ring spinner's arc grows and shrinks as it turns (path length 100). */
  @keyframes rx-arc {
    0% {
      stroke-dasharray: 8 100;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 62 100;
      stroke-dashoffset: -18;
    }
    100% {
      stroke-dasharray: 8 100;
      stroke-dashoffset: -100;
    }
  }

  @keyframes rx-dot {
    0%,
    70%,
    100% {
      transform: translateY(0);
      opacity: 0.35;
    }
    35% {
      transform: translateY(-60%);
      opacity: 1;
    }
  }

  @keyframes rx-bar {
    0%,
    80%,
    100% {
      transform: scaleY(0.35);
      opacity: 0.45;
    }
    40% {
      transform: scaleY(1);
      opacity: 1;
    }
  }

  /* Never from scale 0: a ring starts as a small visible ring and widens as it fades. */
  @keyframes rx-ripple {
    0% {
      transform: scale(0.4);
      opacity: 0.9;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }

  @keyframes rx-breathe {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.45;
    }
  }

  @keyframes rx-shimmer {
    0% {
      transform: translateX(-100%);
    }
    60%,
    100% {
      transform: translateX(100%);
    }
  }

  @keyframes rx-indeterminate {
    0% {
      transform: translateX(-100%) scaleX(0.4);
    }
    50% {
      transform: translateX(60%) scaleX(0.6);
    }
    100% {
      transform: translateX(250%) scaleX(0.4);
    }
  }

  /* A strip drawn twice end to end: half its width is one full pass. */
  @keyframes rx-marquee {
    to {
      transform: translateX(-50%);
    }
  }
}

@theme inline {
${map.map((m) => `  ${m}`).join('\n')}
}

${durations.join('\n\n')}

${playback}

${numeric}

${sheet}

${scrollbar}
`;
}

async function main() {
  const resolved = new Map<string, TokenMap>();
  for (const theme of THEMES) {
    for (const mode of MODES)
      resolved.set(`${theme}/${mode}`, await resolve(themeSources(theme, mode)));
  }
  const contract = checkContract(resolved);
  const modeSources = (file: string) => [...themeSources('default', 'light'), src(`modes/${file}`)];
  const compact = await resolve(modeSources('compact.json'), src('modes/compact.json'));
  const reduced = await resolve(
    modeSources('reduced-motion.json'),
    src('modes/reduced-motion.json'),
  );

  const skins = new Map<string, TokenMap>();
  const skinned = new Map<string, TokenMap>();
  for (const skin of SKINS) {
    if (skin === NO_SKIN) throw new Error(`"${NO_SKIN}" turns a skin off; no skin may use the id`);
    skins.set(skin, await resolveSkin(skin));
    for (const theme of THEMES)
      for (const mode of MODES)
        skinned.set(`${theme}/${mode}/${skin}`, await resolve(skinSources(theme, mode, skin)));
  }
  // A skin never adds a token: every skinned theme mode holds exactly the contract.
  checkContract(
    new Map([['default/light', resolved.get('default/light') ?? emptyTokens()], ...skinned]),
  );

  const contractTypes: TokenMap = resolved.get('default/light') ?? emptyTokens();
  mkdirSync(dist, { recursive: true });
  writeFileSync(join(dist, 'themes.css'), themesCss(resolved, skins, compact, reduced));
  writeFileSync(join(dist, 'tailwind.css'), tailwindCss(contract, contractTypes));
  copyFileSync(src('fonts.css'), join(dist, 'fonts.css'));

  /** Theme, then mode, then token: the resolved maps under `key(theme, mode)`. */
  const byThemeMode = (maps: Map<string, TokenMap>, key: (theme: string, mode: Mode) => string) =>
    Object.fromEntries(
      THEMES.map((theme) => [
        theme,
        Object.fromEntries(
          MODES.map((mode) => [mode, plain(maps.get(key(theme, mode)) ?? emptyTokens())]),
        ),
      ]),
    );
  const json = {
    contract: contract.map((name) => ({ name, type: contractTypes.get(name)?.type })),
    themes: byThemeMode(resolved, (theme, mode) => `${theme}/${mode}`),
    // Each skin's own overrides, and every theme and mode as it resolves under the skin.
    skins: Object.fromEntries(
      SKINS.map((skin) => [
        skin,
        {
          tokens: plain(skins.get(skin) ?? emptyTokens()),
          themes: byThemeMode(skinned, (theme, mode) => `${theme}/${mode}/${skin}`),
        },
      ]),
    ),
  };
  writeFileSync(join(dist, 'tokens.json'), `${JSON.stringify(json, null, 2)}\n`);
  console.log(
    `tokens: ${contract.length} tokens x ${resolved.size} theme modes, ${skins.size} skins -> dist/`,
  );
}

await main();

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
  THEMES,
  cssVarName,
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

async function resolve(sources: string[], onlyFrom?: string): Promise<TokenMap> {
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

function themesCss(resolved: Map<string, TokenMap>, compact: TokenMap, reduced: TokenMap): string {
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
  parts.push(
    block(
      ['[data-density="compact"]', '[data-density="compact"] [data-theme]'],
      [...declarations(compact), ...declarations(componentRefs)],
    ),
  );
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

  const durations = ['fast', 'base', 'slow', 'reveal'].map(
    (d) => `@utility duration-${d} {\n  transition-duration: var(--rx-motion-duration-${d});\n}`,
  );
  const numeric = `/* Money and quantities: the numeric family with tabular, lining figures. */
@utility numeric {
  font-family: var(--rx-font-family-numeric);
  font-variant-numeric: tabular-nums lining-nums;
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
}

@theme inline {
${map.map((m) => `  ${m}`).join('\n')}
}

${durations.join('\n\n')}

${numeric}

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

  const contractTypes: TokenMap = resolved.get('default/light') ?? emptyTokens();
  mkdirSync(dist, { recursive: true });
  writeFileSync(join(dist, 'themes.css'), themesCss(resolved, compact, reduced));
  writeFileSync(join(dist, 'tailwind.css'), tailwindCss(contract, contractTypes));
  copyFileSync(src('fonts.css'), join(dist, 'fonts.css'));

  const json = {
    contract: contract.map((name) => ({ name, type: contractTypes.get(name)?.type })),
    themes: Object.fromEntries(
      THEMES.map((theme) => [
        theme,
        Object.fromEntries(
          MODES.map((mode) => {
            const tokens: TokenMap = resolved.get(`${theme}/${mode}`) ?? emptyTokens();
            return [
              mode,
              Object.fromEntries([...tokens].map(([name, { value }]) => [name, value])),
            ];
          }),
        ),
      ]),
    ),
  };
  writeFileSync(join(dist, 'tokens.json'), `${JSON.stringify(json, null, 2)}\n`);
  console.log(`tokens: ${contract.length} tokens x ${resolved.size} theme modes -> dist/`);
}

await main();

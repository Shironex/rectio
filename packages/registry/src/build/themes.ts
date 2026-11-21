import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { normalizeLineEndings } from '../integrity.ts';
import { printBlock, splitBlocks, type CssBlock } from './css.ts';

export interface SplitTokens {
  /** tailwind.css without its themes import, plus the theme-independent blocks. */
  tokensCss: string;
  /** Per theme id: its font imports and its light, dark and system-dark blocks. */
  themes: Map<string, { css: string; fontPackages: string[] }>;
  /** Per skin id: its font imports, its one block, and the token names it sets. */
  skins: Map<string, { css: string; fontPackages: string[]; tokens: string[] }>;
  /** Token families with no font import, such as system stacks. Informational. */
  warnings: string[];
}

interface TokensJson {
  themes: Record<string, Record<string, Record<string, string>>>;
  skins?: Record<string, { tokens: Record<string, string> }>;
}

const HEADER =
  '/* rectio tokens. Generated from @rectio/tokens: edit freely, `rectio diff` shows your changes. */';
const THEME_IMPORT = /^@import '\.\/themes\.css';\n/m;
const THEME_SELECTOR = /\[data-theme="([^"]+)"\]/g;
const SKIN_SELECTOR = /\[data-skin="([^"]+)"\]/g;

/** The one id a selector list names through `pattern`, or undefined when it names none. */
function idOf(prelude: string, pattern: RegExp, what: string): string | undefined {
  const ids = new Set([...prelude.matchAll(pattern)].map((m) => m[1] ?? ''));
  if (ids.size > 1) throw new Error(`a rule targets several ${what}: ${prelude}`);
  return [...ids][0];
}

/** The theme a selector list belongs to, or undefined for theme-independent rules. */
const themeOf = (prelude: string) => idOf(prelude, THEME_SELECTOR, 'themes');
/** The skin a selector list belongs to: a skin's rules never name a theme id. */
const skinOf = (prelude: string) => idOf(prelude, SKIN_SELECTOR, 'skins');

/** `"IBM Plex Sans Variable", ...` -> `ibm-plex-sans`, the fontsource package slug. */
export function fontSlug(familyList: string): string | undefined {
  const first = /^\s*"([^"]+)"/.exec(familyList)?.[1];
  if (first === undefined) return undefined;
  return first
    .toLowerCase()
    .replace(/\s+variable$/, '')
    .replace(/\s+/g, '-');
}

/** `@import '@fontsource-variable/ibm-plex-sans/wght.css';` lines with their package. */
function fontImports(fontsCss: string): { line: string; pkg: string; slug: string }[] {
  const out: { line: string; pkg: string; slug: string }[] = [];
  for (const match of fontsCss.matchAll(/^@import '((@[^/]+\/[^/']+)[^']*)';$/gm)) {
    const pkg = match[2] ?? '';
    out.push({ line: match[0], pkg, slug: pkg.split('/')[1] ?? '' });
  }
  return out;
}

/**
 * Splits the built token stylesheet into a theme-independent tokens file and one file per theme,
 * reusing the exact output of @rectio/tokens instead of re-deriving it.
 */
export function splitTokens(tokensDir: string): SplitTokens {
  const read = (path: string) => normalizeLineEndings(readFileSync(join(tokensDir, path), 'utf8'));
  const themesCss = read('dist/themes.css');
  const tailwindCss = read('dist/tailwind.css');
  const fontsCss = read('dist/fonts.css');
  const tokens = JSON.parse(read('dist/tokens.json')) as TokensJson;

  if (!THEME_IMPORT.test(tailwindCss)) {
    throw new Error("dist/tailwind.css no longer imports './themes.css': update splitTokens");
  }

  const perTheme = new Map<string, string[]>();
  const perSkin = new Map<string, string[]>();
  const shared: string[] = [];
  const push = (theme: string, text: string) => {
    perTheme.set(theme, [...(perTheme.get(theme) ?? []), text]);
  };

  for (const raw of splitBlocks(themesCss)) {
    // The generated-file banner is not part of any rule.
    const block = raw.comment.includes('Do not edit') ? { ...raw, comment: '' } : raw;
    if (block.prelude.startsWith('@media')) {
      const inner = splitBlocks(block.body);
      const groups = new Map<string | undefined, CssBlock[]>();
      for (const rule of inner) {
        const theme = themeOf(rule.prelude);
        groups.set(theme, [...(groups.get(theme) ?? []), rule]);
      }
      for (const [theme, rules] of groups) {
        const text = printBlock({
          comment: block.comment,
          prelude: block.prelude,
          body: `\n${rules.map((r) => printBlock(r, '  ')).join('\n')}`,
        });
        if (theme === undefined) shared.push(text);
        else push(theme, text);
      }
      continue;
    }
    const skin = skinOf(block.prelude);
    if (skin !== undefined) {
      if (themeOf(block.prelude) !== undefined)
        throw new Error(`a skin rule names a theme: ${block.prelude}`);
      perSkin.set(skin, [...(perSkin.get(skin) ?? []), printBlock(block)]);
      continue;
    }
    const theme = themeOf(block.prelude);
    if (theme === undefined) shared.push(printBlock(block));
    else push(theme, printBlock(block));
  }

  const imports = fontImports(fontsCss);
  const warnings: string[] = [];
  /** The font imports for every family in `values`, warning about a family with none. */
  const fontsOf = (label: string, values: Iterable<Record<string, string>>) => {
    const slugs = new Set<string>();
    for (const map of values) {
      for (const [name, value] of Object.entries(map)) {
        if (!name.startsWith('--rx-font-family-')) continue;
        const slug = fontSlug(value);
        if (slug !== undefined) slugs.add(slug);
      }
    }
    const used = imports.filter((i) => slugs.has(i.slug));
    for (const slug of slugs) {
      if (!used.some((i) => i.slug === slug))
        warnings.push(`${label}: no font import for "${slug}"`);
    }
    return {
      lines: used.length > 0 ? [used.map((i) => i.line).join('\n')] : [],
      packages: [...new Set(used.map((i) => i.pkg))],
    };
  };

  const themes = new Map<string, { css: string; fontPackages: string[] }>();
  for (const id of Object.keys(tokens.themes)) {
    const blocks = perTheme.get(id);
    if (blocks === undefined) throw new Error(`theme "${id}" has no rules in dist/themes.css`);
    const fonts = fontsOf(`theme "${id}"`, Object.values(tokens.themes[id] ?? {}));
    const css = [
      `/* rectio theme "${id}". Generated from @rectio/tokens. Fonts: SIL Open Font License 1.1. */`,
      ...fonts.lines,
      ...blocks,
    ].join('\n\n');
    themes.set(id, { css: `${css}\n`, fontPackages: fonts.packages });
  }
  for (const id of perTheme.keys()) {
    if (!themes.has(id)) throw new Error(`dist/themes.css has rules for unknown theme "${id}"`);
  }

  const skins = new Map<string, { css: string; fontPackages: string[]; tokens: string[] }>();
  for (const [id, skin] of Object.entries(tokens.skins ?? {})) {
    const blocks = perSkin.get(id);
    if (blocks === undefined) throw new Error(`skin "${id}" has no rules in dist/themes.css`);
    const fonts = fontsOf(`skin "${id}"`, [skin.tokens]);
    const css = [
      `/* rectio skin "${id}". Generated from @rectio/tokens. Set data-skin="${id}" on any element. */`,
      ...fonts.lines,
      ...blocks,
    ].join('\n\n');
    skins.set(id, {
      css: `${css}\n`,
      fontPackages: fonts.packages,
      tokens: Object.keys(skin.tokens),
    });
  }
  for (const id of perSkin.keys()) {
    if (!skins.has(id)) throw new Error(`dist/themes.css has rules for unknown skin "${id}"`);
  }

  const body = tailwindCss.replace(THEME_IMPORT, '').replace(/^\/\*.*Do not edit\. \*\/\n/, '');
  const tokensCss = `${HEADER}\n${body.trimEnd()}\n\n${shared.join('\n\n')}\n`;
  return { tokensCss, themes, skins, warnings };
}

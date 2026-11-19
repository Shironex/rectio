import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { normalizeLineEndings } from '../integrity.ts';
import { printBlock, splitBlocks, type CssBlock } from './css.ts';

export interface SplitTokens {
  /** tailwind.css without its themes import, plus the theme-independent blocks. */
  tokensCss: string;
  /** Per theme id: its font imports and its light, dark and system-dark blocks. */
  themes: Map<string, { css: string; fontPackages: string[] }>;
  /** Token families with no font import, such as system stacks. Informational. */
  warnings: string[];
}

interface TokensJson {
  themes: Record<string, Record<string, Record<string, string>>>;
}

const HEADER =
  '/* rectio tokens. Generated from @rectio/tokens: edit freely, `rectio diff` shows your changes. */';
const THEME_IMPORT = /^@import '\.\/themes\.css';\n/m;
const THEME_SELECTOR = /\[data-theme="([^"]+)"\]/g;

/** The theme a selector list belongs to, or undefined for theme-independent rules. */
function themeOf(prelude: string): string | undefined {
  const ids = new Set([...prelude.matchAll(THEME_SELECTOR)].map((m) => m[1] ?? ''));
  if (ids.size > 1) throw new Error(`a rule targets several themes: ${prelude}`);
  return [...ids][0];
}

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
    const theme = themeOf(block.prelude);
    if (theme === undefined) shared.push(printBlock(block));
    else push(theme, printBlock(block));
  }

  const imports = fontImports(fontsCss);
  const warnings: string[] = [];
  const themes = new Map<string, { css: string; fontPackages: string[] }>();
  for (const id of Object.keys(tokens.themes)) {
    const blocks = perTheme.get(id);
    if (blocks === undefined) throw new Error(`theme "${id}" has no rules in dist/themes.css`);
    const slugs = new Set<string>();
    for (const values of Object.values(tokens.themes[id] ?? {})) {
      for (const [name, value] of Object.entries(values)) {
        if (!name.startsWith('--rx-font-family-')) continue;
        const slug = fontSlug(value);
        if (slug !== undefined) slugs.add(slug);
      }
    }
    const used = imports.filter((i) => slugs.has(i.slug));
    for (const slug of slugs) {
      if (!used.some((i) => i.slug === slug)) {
        warnings.push(`theme "${id}": no font import for "${slug}"`);
      }
    }
    const fontLines = used.map((i) => i.line);
    const css = [
      `/* rectio theme "${id}". Generated from @rectio/tokens. Fonts: SIL Open Font License 1.1. */`,
      ...(fontLines.length > 0 ? [fontLines.join('\n')] : []),
      ...blocks,
    ].join('\n\n');
    themes.set(id, { css: `${css}\n`, fontPackages: [...new Set(used.map((i) => i.pkg))] });
  }
  for (const id of perTheme.keys()) {
    if (!themes.has(id)) throw new Error(`dist/themes.css has rules for unknown theme "${id}"`);
  }

  const body = tailwindCss.replace(THEME_IMPORT, '').replace(/^\/\*.*Do not edit\. \*\/\n/, '');
  const tokensCss = `${HEADER}\n${body.trimEnd()}\n\n${shared.join('\n\n')}\n`;
  return { tokensCss, themes, warnings };
}

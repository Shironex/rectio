import { dirname, relative, sep } from 'node:path';

import { normalizeLineEndings } from '@rectio/registry';

import type { Lockfile } from './lockfile.ts';
import { CliError } from './context.ts';
import { lineEndingOf, withLineEnding } from './fs.ts';
import { importsTailwind } from './project.ts';

const START = '/* rectio:start (managed by the rectio CLI, do not edit between the markers) */';
const END = '/* rectio:end */';
const BLOCK = /\/\* rectio:start[^*]*\*\/[\s\S]*?\/\* rectio:end \*\/\n?/;
const TAILWIND_LINE = /^\s*@import\s+['"]tailwindcss['"][^;]*;[^\n]*\n?/m;
const DEFAULT_THEME_ITEM = 'theme-default';

/**
 * CSS files to import, in cascade order: the default theme (it owns :root), other themes, then
 * styles, so the base layer's density and reduced-motion rules win at equal specificity.
 */
export function cssImports(lock: Lockfile): string[] {
  const rank = (item: string, type: string) =>
    type === 'theme' ? (item === DEFAULT_THEME_ITEM ? 0 : 1) : 2;
  return Object.entries(lock.items)
    .flatMap(([item, locked]) =>
      locked.files
        .filter((f) => f.type === 'theme' || f.type === 'style')
        .map((f) => ({ path: f.path, rank: rank(item, f.type) })),
    )
    .sort((a, b) => a.rank - b.rank || (a.path < b.path ? -1 : 1))
    .map((f) => f.path);
}

/** The managed import block right after `@import "tailwindcss"`, replacing any earlier one. */
export function updateCssEntry(css: string, entryPath: string, files: readonly string[]): string {
  if (!importsTailwind(css)) {
    throw new CliError(
      `${entryPath} does not import Tailwind`,
      'Add @import "tailwindcss"; to it.',
    );
  }
  const from = dirname(entryPath);
  const lines = files.map((file) => {
    const rel = relative(from, file).split(sep).join('/');
    return `@import '${rel.startsWith('.') ? rel : `./${rel}`}';`;
  });
  const block = files.length === 0 ? '' : `${START}\n${lines.join('\n')}\n${END}\n`;
  // Edited with LF, written back with the file's own endings: a CRLF entry stays CRLF throughout.
  const without = normalizeLineEndings(css).replace(BLOCK, '');
  const next = without.replace(
    TAILWIND_LINE,
    (line) => `${line.endsWith('\n') ? line : `${line}\n`}${block}`,
  );
  return withLineEnding(next, lineEndingOf(css));
}

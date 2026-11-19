import { join } from 'node:path';

import {
  ALIAS_KEYS,
  REGISTRY_IMPORT_PREFIX,
  normalizeLineEndings,
  type AliasKey,
  type CssVars,
  type ItemFile,
} from '@rectio/registry';

import type { RectioConfig } from './config.ts';
import { CliError } from './context.ts';
import { resolveAlias, type AliasRoot } from './project.ts';

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CANONICAL = new RegExp(
  `(['"])${escape(REGISTRY_IMPORT_PREFIX)}(${ALIAS_KEYS.join('|')})/`,
  'g',
);
const SCRIPT_FILE = /\.[cm]?[jt]sx?$/;

/**
 * `@registry/ui/field` -> `@/components/ui/field` with the project's aliases. Only quoted
 * specifiers match, so prose that mentions the prefix is left alone.
 */
export function rewriteImports(content: string, aliases: RectioConfig['aliases']): string {
  return content.replace(CANONICAL, (_match, quote: string, key: AliasKey) => {
    return `${quote}${aliases[key].replace(/\/+$/, '')}/`;
  });
}

/** The content a file gets in this project: aliases rewritten for scripts, LF endings. */
export function projectContent(file: ItemFile, aliases: RectioConfig['aliases']): string {
  const content = normalizeLineEndings(file.content);
  return SCRIPT_FILE.test(file.path) ? rewriteImports(content, aliases) : content;
}

/** `@ui/button.tsx` -> absolute path, through the configured alias and tsconfig paths. */
export function resolveTarget(
  target: string,
  aliases: RectioConfig['aliases'],
  roots: readonly AliasRoot[],
): string {
  const slash = target.indexOf('/');
  const key = target.slice(1, slash) as AliasKey;
  const alias = aliases[key];
  const dir = resolveAlias(roots, alias);
  if (dir === undefined) {
    throw new CliError(
      `the alias "${alias}" (aliases.${key} in rectio.json) matches no tsconfig "paths" entry`,
      'Add the alias to tsconfig.json compilerOptions.paths, or change rectio.json.',
    );
  }
  return join(dir, ...target.slice(slash + 1).split('/'));
}

/** Token additions as a style file the CSS entry imports. */
export function cssVarsFile(name: string, cssVars: CssVars): ItemFile | undefined {
  const block = (selector: string, vars: Record<string, string> | undefined) => {
    const entries = Object.entries(vars ?? {});
    if (entries.length === 0) return undefined;
    return `${selector} {\n${entries.map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`;
  };
  const blocks = [
    block('@theme inline', cssVars.theme),
    block(':root', cssVars.light),
    block('[data-mode="dark"]', cssVars.dark),
  ].filter((b) => b !== undefined);
  if (blocks.length === 0) return undefined;
  const content = `/* Token additions of ${name}. */\n${blocks.join('\n\n')}\n`;
  return {
    path: `styles/vars/${name}.css`,
    type: 'style',
    target: `@styles/vars/${name}.css`,
    content,
    sha256: '',
  };
}

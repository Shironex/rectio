import {
  itemTypeSchema,
  resolveGraph,
  type IndexEntry,
  type RegistryIndex,
  type RegistryItem,
} from '@rectio/registry';

import { rankMatches } from '../commands/list.ts';
import { readConfig, type RectioConfig } from '../core/config.ts';
import { CliError } from '../core/context.ts';
import type { RegistryClient } from '../core/registry-client.ts';
import { projectContent } from '../core/transform.ts';
import { themeValues, tailwindUtilities } from './tokens.ts';

/** What the tools read from. Nothing here writes: the MCP server is read-only. */
export interface McpDeps {
  client: RegistryClient;
  /** The project folder, to read rectio.json (aliases, registry) from. */
  cwd: string;
  /** Set only when `rectio mcp --registry` was given: repeated in the add commands it returns. */
  registryFlag?: string;
}

export interface ToolResult {
  text: string;
  isError?: boolean;
}

export const ITEM_TYPES = itemTypeSchema.options;

/**
 * The most rows a list or search returns. A list row is one short line, so listing defaults to the
 * maximum: the whole registry fits, and an agent never has to guess that items were cut off.
 */
export const MAX_LIMIT = 500;
const DEFAULT_LIMIT = MAX_LIMIT;
const TOKENS_ITEM = 'tokens';
const THEME_PREFIX = 'theme-';

/** Turns an expected failure into a tool error with the same message the CLI would print. */
export async function guard(run: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof CliError) {
      return {
        text: error.hint === undefined ? error.message : `${error.message}\n${error.hint}`,
        isError: true,
      };
    }
    throw error;
  }
}

const fail = (text: string): ToolResult => ({ text, isError: true });

function line(entry: IndexEntry, withDescription: boolean): string {
  const head = `${entry.name} | ${entry.type} | ${entry.version} | ${entry.title}`;
  return withDescription ? `${head}\n  ${entry.description}` : head;
}

/** Levenshtein distance, for "did you mean" on a mistyped item name. */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row.push(
        Math.min((previous[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (previous[j - 1] ?? 0) + cost),
      );
    }
    previous = row;
  }
  return previous[b.length] ?? 0;
}

function findEntry(index: RegistryIndex, name: string): IndexEntry {
  const entry = index.items.find((e) => e.name === name);
  if (entry !== undefined) return entry;
  const close = [
    ...rankMatches(index.items, name),
    ...index.items.filter((e) => editDistance(e.name, name) <= 2),
  ]
    .map((e) => e.name)
    .filter((n, i, all) => all.indexOf(n) === i)
    .slice(0, 3);
  throw new CliError(
    `no item named "${name}"`,
    close.length > 0
      ? `Did you mean: ${close.join(', ')}? Use list_items to see all.`
      : 'Use list_items to see all.',
  );
}

function safeConfig(cwd: string): RectioConfig | undefined {
  try {
    return readConfig(cwd);
  } catch {
    return undefined;
  }
}

function filtered(entries: readonly IndexEntry[], type: string | undefined): IndexEntry[] {
  return entries.filter((e) => type === undefined || e.type === type);
}

function render(entries: readonly IndexEntry[], limit: number, withDescription: boolean): string {
  if (entries.length === 0) return 'No items match.';
  const shown = entries.slice(0, limit);
  const rows = ['name | type | version | title', ...shown.map((e) => line(e, withDescription))];
  if (entries.length > shown.length) {
    rows.push(`... ${entries.length - shown.length} more; narrow the filters or raise limit.`);
  }
  return rows.join('\n');
}

export interface ListArgs {
  type?: string | undefined;
  limit?: number | undefined;
}

export async function listItems(deps: McpDeps, args: ListArgs): Promise<ToolResult> {
  const { items } = await deps.client.index();
  const matches = filtered(items, args.type);
  return {
    text: `${matches.length} item(s)\n${render(matches, args.limit ?? DEFAULT_LIMIT, false)}`,
  };
}

export interface SearchArgs extends ListArgs {
  query: string;
}

export async function searchItems(deps: McpDeps, args: SearchArgs): Promise<ToolResult> {
  const words = args.query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return fail('give a query, for example "money" or "date picker"');
  const { items } = await deps.client.index();
  const pool = filtered(items, args.type);
  // Every word must match somewhere (name, title, categories, description); the first word ranks.
  const all = pool.filter((e) => words.every((w) => rankMatches([e], w).length > 0));
  const matches = rankMatches(all, words[0] ?? '');
  return {
    text: `${matches.length} match(es) for "${args.query}"\n${render(matches, args.limit ?? 10, true)}`,
  };
}

function listFiles(item: RegistryItem): string[] {
  return item.files.map(
    (f) => `  ${f.path} -> ${f.target} (${f.type}, ${f.content.split('\n').length} lines)`,
  );
}

function installSet(index: RegistryIndex, names: readonly string[]): IndexEntry[] {
  const byName = new Map(index.items.map((e) => [e.name, e]));
  try {
    return resolveGraph(names, (n) => byName.get(n));
  } catch (error) {
    throw new CliError((error as Error).message, 'Use list_items to see the available items.');
  }
}

export async function getItem(deps: McpDeps, args: { name: string }): Promise<ToolResult> {
  const index = await deps.client.index();
  const entry = findEntry(index, args.name);
  const lines = [
    `${entry.name} | ${entry.type} | ${entry.version}`,
    entry.title,
    entry.description,
    `Categories: ${entry.categories.join(', ') || 'none'}`,
    `Versions: ${entry.versions.join(', ')}`,
  ];
  const withDeps = installSet(index, [entry.name])
    .map((e) => e.name)
    .filter((n) => n !== entry.name);
  lines.push(`Registry dependencies (installed with it): ${withDeps.join(', ') || 'none'}`);

  const item = await deps.client.item(entry);
  const npm = Object.entries(item.dependencies).map(([n, v]) => `${n}@${v}`);
  const requires = Object.entries(item.requires).map(([n, v]) => `${n} ${String(v)}`);
  lines.push(
    `npm packages: ${npm.join(', ') || 'none'}`,
    `Requires: ${requires.join(', ') || 'none'}`,
    `Files (${item.files.length}):`,
    ...listFiles(item),
  );
  if (item.docs !== undefined) lines.push(`Notes: ${item.docs}`);
  if (item.deprecated !== undefined) lines.push(`Deprecated: ${item.deprecated}`);
  lines.push(`Add: rectio add ${entry.name}`);
  return { text: lines.join('\n') };
}

export async function getItemSource(
  deps: McpDeps,
  args: { name: string; file?: string | undefined },
): Promise<ToolResult> {
  const index = await deps.client.index();
  const entry = findEntry(index, args.name);
  const item = await deps.client.item(entry);
  const wanted = args.file?.replace(/\\/g, '/');
  const files =
    wanted === undefined
      ? item.files
      : item.files.filter(
          (f) => f.path === wanted || f.target === wanted || f.path.endsWith(`/${wanted}`),
        );
  if (files.length === 0) {
    return fail(
      `${entry.name} has no file "${wanted ?? ''}". Files: ${item.files.map((f) => f.path).join(', ')}`,
    );
  }
  const config = safeConfig(deps.cwd);
  const parts = [
    `${entry.name}@${item.version}: ${files.length} of ${item.files.length} file(s). ${
      config === undefined
        ? 'Imports use the registry form (@registry/<alias>/...); `rectio add` rewrites them to your aliases.'
        : 'Imports are rewritten to the aliases in rectio.json.'
    }`,
  ];
  for (const file of files) {
    const content = config === undefined ? file.content : projectContent(file, config.aliases);
    parts.push(`--- ${file.path} (installs as ${file.target})\n${content.trimEnd()}`);
  }
  return { text: parts.join('\n\n') };
}

export interface TokenArgs {
  theme?: string | undefined;
  mode?: 'light' | 'dark' | undefined;
  filter?: string | undefined;
}

export async function getTokens(deps: McpDeps, args: TokenArgs): Promise<ToolResult> {
  const index = await deps.client.index();
  const themes = index.items.filter((e) => e.type === 'theme');
  const id = (args.theme ?? 'default').replace(THEME_PREFIX, '');
  const entry = themes.find((e) => e.name === `${THEME_PREFIX}${id}`);
  if (entry === undefined) {
    return fail(
      `no theme "${id}". Themes: ${themes.map((e) => e.name.slice(THEME_PREFIX.length)).join(', ')}`,
    );
  }
  const theme = await deps.client.item(entry);
  const css = theme.files.find((f) => f.type === 'theme')?.content ?? '';
  const mode = args.mode ?? 'light';
  const values = themeValues(css, id, mode);

  let utilities = new Map<string, string>();
  const tokensEntry = index.items.find((e) => e.name === TOKENS_ITEM);
  if (tokensEntry !== undefined) {
    const tokens = await deps.client.item(tokensEntry);
    utilities = tailwindUtilities(tokens.files.map((f) => f.content).join('\n'));
  }

  const needle = args.filter?.toLowerCase();
  const rows: string[] = [];
  let family = '';
  for (const [name, value] of values) {
    const short = name.slice('--rx-'.length);
    if (needle !== undefined && !short.includes(needle)) continue;
    const head = short.split('-')[0] ?? '';
    if (head !== family) {
      if (family !== '') rows.push('');
      family = head;
    }
    const utility = utilities.get(name);
    rows.push(`${name}: ${value}${utility === undefined ? '' : `   [tailwind: ${utility}]`}`);
  }
  if (rows.length === 0) return fail(`no token of theme "${id}" contains "${args.filter ?? ''}"`);
  return {
    text: [
      `Theme "${id}", ${mode} mode: ${values.size} tokens${needle === undefined ? '' : ` (filtered by "${needle}")`}.`,
      'Style with the Tailwind utilities in brackets (color-surface means bg-surface, text-surface, border-surface; text-*, radius-*, shadow-* and ease-* are sizes and effects), never raw values. Set data-theme and data-mode on <html> or inside ThemeScope.',
      '',
      ...rows,
    ].join('\n'),
  };
}

const GENERAL_DOCS = [
  'rectio: finance and back-office components, copied into your project as source (you own the code).',
  '',
  'Workflow: `rectio init` once (rectio.json, tokens, a theme, the cn helper), then `rectio add <items>`. Dependencies between items are installed with them. `rectio diff <item>` compares with upstream.',
  'Styling: components read semantic tokens only. Use Tailwind utilities such as bg-surface, text-fg, border-line, bg-accent; never hex or the default Tailwind palette (it is removed). get_tokens lists them with values.',
  'Theming: data-theme="<id>" on <html> (or a ThemeScope component for a subtree) picks a theme; data-mode="dark" picks dark (without it the system setting decides); data-density="compact" tightens controls.',
  'Money and quantities: the `numeric` utility gives tabular lining figures.',
  'This MCP server is read-only: get_add_command returns the command, you run it.',
  'Per-item notes: call get_docs with an item name.',
].join('\n');

function exportsOf(content: string): string[] {
  const names = new Set<string>();
  for (const m of content.matchAll(
    /^export\s+(?:default\s+)?(?:declare\s+)?(?:async\s+)?(?:function|const|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm,
  )) {
    names.add(m[1] ?? '');
  }
  for (const m of content.matchAll(/^export\s+(?:type\s+)?\{([^}]*)\}/gm)) {
    for (const part of (m[1] ?? '').split(',')) {
      const name = part
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name !== undefined && name !== '') names.add(name);
    }
  }
  return [...names];
}

export async function getDocs(
  deps: McpDeps,
  args: { item?: string | undefined },
): Promise<ToolResult> {
  if (args.item === undefined) return { text: GENERAL_DOCS };
  const index = await deps.client.index();
  const entry = findEntry(index, args.item);
  const item = await deps.client.item(entry);
  const lines = [`${item.name}@${item.version}: ${item.title}`, item.description];
  if (item.docs === undefined) {
    lines.push(
      'The registry has no usage notes for this item; this summary is derived from its source.',
    );
  } else {
    lines.push(`Usage notes: ${item.docs}`);
  }
  for (const file of item.files) {
    if (!/\.[cm]?[jt]sx?$/.test(file.path)) continue;
    const names = exportsOf(file.content);
    if (names.length > 0)
      lines.push(
        `Exports of ${file.path} (import from the "${file.target.split('/')[0]}" alias): ${names.join(', ')}`,
      );
  }
  if (item.theme !== undefined) {
    lines.push(
      `Theme "${item.theme.id}": modes ${item.theme.modes.join(', ')}; densities ${item.theme.densities.join(', ')}. See get_tokens.`,
    );
  }
  if (item.registryDependencies.length > 0)
    lines.push(`Installs with: ${item.registryDependencies.join(', ')}`);
  lines.push('For the full source use get_item_source.');
  return { text: lines.join('\n') };
}

export interface AddArgs {
  items: string[];
  overwrite?: boolean | undefined;
  dry_run?: boolean | undefined;
}

export async function getAddCommand(deps: McpDeps, args: AddArgs): Promise<ToolResult> {
  const index = await deps.client.index();
  const templates = args.items
    .map((name) => findEntry(index, name))
    .filter((e) => e.type === 'template');
  if (templates.length > 0) {
    // A template starts a new project; it is never added to an existing one.
    return {
      text: [
        ...templates.map(
          (t) =>
            `rectio init --template ${t.name} ${t.name}${deps.registryFlag === undefined ? '' : ` --registry ${JSON.stringify(deps.registryFlag)}`}`,
        ),
        `${templates.map((t) => t.name).join(', ')} ${templates.length === 1 ? 'is a template' : 'are templates'}: the command creates a new project folder (the last argument).`,
        'Run it in the parent folder of the new project. This server does not write files.',
      ].join('\n'),
    };
  }
  const set = installSet(index, args.items);
  const flags = [
    ...(args.overwrite === true ? ['--overwrite'] : []),
    ...(args.dry_run === true ? ['--dry-run'] : []),
    ...(deps.registryFlag === undefined ? [] : ['--registry', JSON.stringify(deps.registryFlag)]),
  ];
  const command = ['rectio add', ...args.items, ...flags].join(' ');
  const lines = [command];
  const extra = set.map((e) => e.name).filter((n) => !args.items.includes(n));
  if (extra.length > 0) lines.push(`Also installs: ${extra.join(', ')}`);
  if (safeConfig(deps.cwd) === undefined) {
    lines.push('No valid rectio.json here: run `rectio init` first.');
  }
  lines.push('Run it in the project folder. This server does not write files.');
  return { text: lines.join('\n') };
}

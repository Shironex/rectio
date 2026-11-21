import type { IndexEntry } from '@rectio/registry';

import { readConfig, registryUrl } from '../core/config.ts';
import { CliError, type CliContext } from '../core/context.ts';
import { readLock } from '../core/lockfile.ts';
import { outdatedHint, outdatedItems } from '../core/outdated.ts';
import { createRegistryClient } from '../core/registry-client.ts';
import { commandRows, plural } from '../ui/layout.ts';
import { Ui, type OutputOptions } from '../ui/output.ts';
import { pad } from '../ui/style.ts';
import { cliCommand } from '../core/runner.ts';

export interface ListOptions extends OutputOptions {
  registry?: string;
  type?: string;
  /** Templates only, with their category: `rectio list --templates`. */
  templates?: boolean;
}

const KINDS: [string, string][] = [
  ['component', 'Components'],
  ['block', 'Blocks'],
  ['theme', 'Themes'],
  ['skin', 'Skins'],
  ['lib', 'Libs'],
  ['hook', 'Hooks'],
  ['style', 'Styles'],
  ['template', 'Templates'],
];

/** Rows of `mark name version [kind] title`, the names and versions lined up across the set. */
function entryRows(ui: Ui, entries: readonly IndexEntry[], withKind: boolean) {
  const { s, g } = ui;
  const installed = readConfig(ui.ctx.cwd) === undefined ? {} : readLock(ui.ctx.cwd).items;
  const width = Math.max(...entries.map((e) => e.name.length));
  const versionWidth = Math.max(...entries.map((e) => e.version.length));
  const kindWidth = Math.max(...entries.map((e) => e.type.length));
  const newer = ui.term.utf8 ? '↑' : '^';
  let marked = false;
  const row = (entry: IndexEntry) => {
    const local = installed[entry.name];
    if (local !== undefined) marked = true;
    const mark =
      local === undefined ? ' ' : local.version === entry.version ? s.green(g.ok) : s.yellow(newer);
    const kind = withKind ? `${s.dim(pad(entry.type, kindWidth))}  ` : '';
    return `${mark} ${pad(entry.name, width)}  ${s.dim(pad(entry.version, versionWidth))}  ${kind}${entry.title}`;
  };
  return {
    row,
    legend: () => (marked ? `${g.ok} installed   ${newer} update available` : undefined),
  };
}

/** `list`: grouped by kind under section rules. */
function printGrouped(ui: Ui, entries: readonly IndexEntry[]) {
  let legend: string | undefined;
  const known = new Set(KINDS.map(([kind]) => kind));
  const groups: [string, string][] = [
    ...KINDS,
    ...[...new Set(entries.map((e) => e.type as string))]
      .filter((t) => !known.has(t))
      .map((t): [string, string] => [t, t]),
  ];
  let first = true;
  for (const [kind, label] of groups) {
    const members = entries.filter((e) => e.type === kind);
    if (members.length === 0) continue;
    if (!first) ui.line();
    first = false;
    ui.rule(`${label} (${String(members.length)})`);
    // Columns line up within a group: one long block name does not widen the components.
    const rows = entryRows(ui, members, false);
    for (const entry of members) ui.line(rows.row(entry));
    legend ??= rows.legend();
  }
  return legend;
}

async function loadIndex(ctx: CliContext, flag: string | undefined) {
  const client = createRegistryClient(registryUrl(ctx, flag, readConfig(ctx.cwd)), ctx.debug);
  return client.index();
}

/** The dim lines under a listing: the legend, the outdated hint and where to go next. */
function footer(ui: Ui, lines: readonly (string | undefined)[]) {
  const shown = lines.filter((line): line is string => line !== undefined);
  if (shown.length === 0) return;
  ui.line();
  for (const line of shown) ui.tip(line);
}

function printTemplates(ui: Ui, entries: readonly IndexEntry[]) {
  if (entries.length === 0) {
    ui.line('No templates yet.');
    return;
  }
  const { s } = ui;
  const width = Math.max(...entries.map((e) => e.name.length));
  const categories = entries.map((e) => e.categories.find((c) => c !== 'template') ?? '');
  const categoryWidth = Math.max(...categories.map((c) => c.length));
  for (const [i, entry] of entries.entries()) {
    ui.line(
      `${pad(entry.name, width)}  ${s.dim(pad(categories[i] ?? '', categoryWidth))}  ${entry.title}: ${s.dim(entry.description)}`,
    );
  }
  ui.line();
  ui.lines(
    commandRows([[cliCommand('init --template <name> [folder]'), 'start a project']], s, ''),
  );
}

export async function runList(ctx: CliContext, options: ListOptions = {}) {
  const ui = new Ui(ctx);
  const index = await loadIndex(ctx, options.registry);
  if (options.templates === true) {
    const templates = index.items.filter((e) => e.type === 'template');
    ui.header('list --templates', plural(templates.length, 'template'));
    printTemplates(ui, templates);
    ui.end();
    return templates;
  }
  const entries = index.items.filter((e) => options.type === undefined || e.type === options.type);
  ui.header(
    'list',
    options.type === undefined
      ? plural(entries.length, 'item')
      : `${plural(entries.length, 'item')}, type ${options.type}`,
  );
  if (entries.length === 0) {
    ui.line('No items match.');
    ui.end();
    return entries;
  }
  const legend = printGrouped(ui, entries);
  const hint =
    readConfig(ctx.cwd) === undefined
      ? undefined
      : outdatedHint(outdatedItems(index, readLock(ctx.cwd)));
  footer(ui, [legend, hint === undefined ? undefined : `${ui.g.warn} ${hint}`]);
  ui.end();
  return entries;
}

/** Name matches first, then title, description and category matches. */
export function rankMatches(entries: readonly IndexEntry[], query: string): IndexEntry[] {
  const q = query.toLowerCase();
  const score = (e: IndexEntry) => {
    if (e.name === q) return 0;
    if (e.name.includes(q)) return 1;
    if (e.title.toLowerCase().includes(q)) return 2;
    if (e.categories.some((c) => c.toLowerCase().includes(q))) return 3;
    if (e.description.toLowerCase().includes(q)) return 4;
    return undefined;
  };
  return entries
    .map((entry) => ({ entry, rank: score(entry) }))
    .filter((m): m is { entry: IndexEntry; rank: number } => m.rank !== undefined)
    .sort((a, b) => a.rank - b.rank || (a.entry.name < b.entry.name ? -1 : 1))
    .map((m) => m.entry);
}

export async function runSearch(
  ctx: CliContext,
  query: string | undefined,
  options: ListOptions = {},
) {
  if (query === undefined || query.trim() === '') {
    throw new CliError('give a search term', `Example: ${cliCommand('search money')}`);
  }
  const ui = new Ui(ctx);
  const entries = rankMatches((await loadIndex(ctx, options.registry)).items, query.trim());
  ui.header('search', `"${query.trim()}", ${plural(entries.length, 'match', 'matches')}`);
  if (entries.length === 0) {
    ui.line('No items match.');
    ui.tip(`Try a shorter word, or browse everything with \`${cliCommand('list')}\`.`);
  } else {
    const { row, legend } = entryRows(ui, entries, true);
    for (const entry of entries) ui.line(row(entry));
    footer(ui, [legend(), `Add one with \`${cliCommand('add <name>')}\`.`]);
  }
  ui.end();
  return entries;
}

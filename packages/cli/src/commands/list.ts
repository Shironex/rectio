import type { IndexEntry } from '@rectio/registry';

import { readConfig, registryUrl } from '../core/config.ts';
import { CliError, type CliContext } from '../core/context.ts';
import { readLock } from '../core/lockfile.ts';
import { createRegistryClient } from '../core/registry-client.ts';

export interface ListOptions {
  registry?: string;
  type?: string;
  tier?: string;
  /** Templates only, with their category: `rectio list --templates`. */
  templates?: boolean;
}

function printEntries(ctx: CliContext, entries: readonly IndexEntry[]) {
  const installed = readConfig(ctx.cwd) === undefined ? {} : readLock(ctx.cwd).items;
  if (entries.length === 0) {
    ctx.log('No items match.');
    return;
  }
  const width = Math.max(...entries.map((e) => e.name.length));
  for (const entry of entries) {
    const local = installed[entry.name];
    const mark = local === undefined ? ' ' : local.version === entry.version ? '*' : '^';
    const tier = entry.tier === 'pro' ? 'pro ' : 'free';
    ctx.log(
      `${mark} ${entry.name.padEnd(width)}  ${entry.type.padEnd(9)} ${tier} ${entry.version.padEnd(8)} ${entry.title}`,
    );
  }
  ctx.log('\n* installed, ^ installed with an update available');
}

async function loadIndex(ctx: CliContext, flag: string | undefined) {
  const client = createRegistryClient(registryUrl(ctx, flag, readConfig(ctx.cwd)));
  return (await client.index()).items;
}

function printTemplates(ctx: CliContext, entries: readonly IndexEntry[]) {
  if (entries.length === 0) {
    ctx.log('No templates yet.');
    return;
  }
  const width = Math.max(...entries.map((e) => e.name.length));
  for (const entry of entries) {
    const category = entry.categories.find((c) => c !== 'template') ?? '';
    const tier = entry.tier === 'pro' ? 'pro ' : 'free';
    ctx.log(
      `  ${entry.name.padEnd(width)}  ${category.padEnd(9)} ${tier} ${entry.title}: ${entry.description}`,
    );
  }
  ctx.log('\nStart a project: rectio init --template <name> [folder]');
}

export async function runList(ctx: CliContext, options: ListOptions = {}) {
  if (options.templates === true) {
    const templates = (await loadIndex(ctx, options.registry)).filter(
      (e) => e.type === 'template' && (options.tier === undefined || e.tier === options.tier),
    );
    printTemplates(ctx, templates);
    return templates;
  }
  const entries = (await loadIndex(ctx, options.registry)).filter(
    (e) =>
      (options.type === undefined || e.type === options.type) &&
      (options.tier === undefined || e.tier === options.tier),
  );
  printEntries(ctx, entries);
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
    throw new CliError('give a search term', 'Example: rectio search money');
  }
  const entries = rankMatches(await loadIndex(ctx, options.registry), query.trim());
  printEntries(ctx, entries);
  return entries;
}

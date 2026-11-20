import { join } from 'node:path';

import { resolveGraph, sha256Hex, type RegistryItem } from '@rectio/registry';

import type { RectioConfig } from './config.ts';
import { CliError, type CliContext } from './context.ts';
import { cssImports, updateCssEntry } from './css-entry.ts';
import { isInside, readNormalized, readText, toProjectPath, writeText } from './fs.ts';
import {
  countDependencies,
  mergeDependencies,
  missingDependencies,
  runInstall,
  type DependencyChanges,
} from './install.ts';
import { lockedFileAt, readLock, writeLock, type LockedFile } from './lockfile.ts';
import { detectPackageManager, readAliasRoots } from './project.ts';
import type { RegistryClient } from './registry-client.ts';
import { cssVarsFile, projectContent, resolveTarget } from './transform.ts';

export interface InstallOptions {
  /** Replace files the user changed (or that rectio did not write). */
  overwrite?: boolean;
  /** Print the plan and write nothing. */
  dryRun?: boolean;
  /** Run the package manager after writing (default true). */
  install?: boolean;
}

export type FileAction = 'create' | 'update' | 'unchanged' | 'conflict';

export interface PlannedFile {
  item: string;
  path: string;
  absolute: string;
  source: string;
  type: LockedFile['type'];
  content: string;
  action: FileAction;
}

export interface InstallReport {
  items: RegistryItem[];
  files: PlannedFile[];
  added: DependencyChanges;
  dryRun: boolean;
}

/** The requested items plus their dependencies, in install order, from the public index. */
export async function resolveItems(client: RegistryClient, names: readonly string[]) {
  const index = await client.index();
  const byName = new Map(index.items.map((entry) => [entry.name, entry]));
  try {
    return resolveGraph(names, (name) => byName.get(name));
  } catch (error) {
    throw new CliError((error as Error).message, 'See `rectio list` for the available items.');
  }
}

function plan(
  ctx: CliContext,
  config: RectioConfig,
  items: readonly RegistryItem[],
  overwrite: boolean,
): PlannedFile[] {
  const roots = readAliasRoots(ctx.cwd);
  const lock = readLock(ctx.cwd);
  const planned: PlannedFile[] = [];
  const claimed = new Map<string, string>();
  for (const item of items) {
    const extra = item.cssVars === undefined ? undefined : cssVarsFile(item.name, item.cssVars);
    for (const file of extra === undefined ? item.files : [...item.files, extra]) {
      const absolute = resolveTarget(file.target, config.aliases, roots);
      if (!isInside(ctx.cwd, absolute)) {
        throw new CliError(`${item.name}: ${file.target} resolves outside the project`);
      }
      const path = toProjectPath(ctx.cwd, absolute);
      const owner = claimed.get(path);
      if (owner !== undefined) throw new CliError(`${owner} and ${item.name} both write ${path}`);
      claimed.set(path, item.name);

      const content = projectContent(file, config.aliases);
      const current = readNormalized(absolute);
      let action: FileAction;
      if (current === undefined) action = 'create';
      else if (current === content) action = 'unchanged';
      else if (overwrite || lockedFileAt(lock, path)?.sha256 === sha256Hex(current)) {
        // Untouched since rectio wrote it: safe to replace with the new version.
        action = 'update';
      } else action = 'conflict';
      planned.push({
        item: item.name,
        path,
        absolute,
        source: file.path,
        type: file.type,
        content,
        action,
      });
    }
  }
  return planned;
}

/**
 * Resolves, fetches and verifies every item first, checks every target, and only then writes:
 * a failed download or a locally edited file leaves the project untouched.
 */
export async function installItems(
  ctx: CliContext,
  config: RectioConfig,
  client: RegistryClient,
  names: readonly string[],
  options: InstallOptions = {},
): Promise<InstallReport> {
  const entries = await resolveItems(client, names);
  const templates = entries.filter((entry) => entry.type === 'template');
  if (templates.length > 0) {
    // A template is a whole project, not files to add to this one.
    throw new CliError(
      `${templates.map((t) => t.name).join(', ')} ${templates.length === 1 ? 'is a template' : 'are templates'}`,
      `Start a new project with \`rectio init --template ${templates[0]?.name ?? '<name>'}\`.`,
    );
  }
  const items = await Promise.all(entries.map((entry) => client.item(entry)));
  const files = plan(ctx, config, items, options.overwrite ?? false);

  const conflicts = files.filter((f) => f.action === 'conflict');
  if (conflicts.length > 0) {
    throw new CliError(
      `${conflicts.length} file(s) differ from what rectio installed:\n${conflicts.map((f) => `  ${f.path} (${f.item})`).join('\n')}`,
      'Run `rectio diff <item>` to see the changes, or pass --overwrite to replace them. Nothing was written.',
    );
  }

  const wanted: DependencyChanges = { dependencies: {}, devDependencies: {} };
  for (const item of items) {
    Object.assign(wanted.dependencies, item.dependencies);
    Object.assign(wanted.devDependencies, item.devDependencies);
  }
  if (options.dryRun === true) {
    return { items, files, added: missingDependencies(ctx.cwd, wanted), dryRun: true };
  }

  for (const file of files) {
    if (file.action === 'create' || file.action === 'update')
      writeText(file.absolute, file.content);
  }

  const lock = readLock(ctx.cwd);
  for (const item of items) {
    lock.items[item.name] = {
      version: item.version,
      type: item.type,
      integrity: item.integrity,
      files: files
        .filter((f) => f.item === item.name)
        .map((f) => ({
          path: f.path,
          source: f.source,
          type: f.type,
          sha256: sha256Hex(f.content),
        })),
    };
  }
  writeLock(ctx.cwd, lock);

  const entry = join(ctx.cwd, config.css);
  const css = readText(entry);
  if (css === undefined) throw new CliError(`the CSS entry ${config.css} does not exist`);
  const next = updateCssEntry(css, config.css, cssImports(lock));
  if (next !== css) writeText(entry, next);

  const added = mergeDependencies(ctx.cwd, wanted);
  const count = countDependencies(added);
  if (count > 0 && options.install !== false) {
    const manager = detectPackageManager(ctx.cwd);
    ctx.log(`Installing ${count} package(s) with ${manager}...`);
    await runInstall(ctx.cwd, manager);
  }
  return { items, files, added, dryRun: false };
}

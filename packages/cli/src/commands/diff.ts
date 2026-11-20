import { sha256Hex } from '@rectio/registry';
import { createTwoFilesPatch } from 'diff';

import { requireConfig, registryUrl } from '../core/config.ts';
import { CliError, type CliContext } from '../core/context.ts';
import { isInside, readNormalized, toProjectPath } from '../core/fs.ts';
import { resolveItems } from '../core/installer.ts';
import { readLock } from '../core/lockfile.ts';
import { readAliasRoots } from '../core/project.ts';
import { createRegistryClient } from '../core/registry-client.ts';
import { projectContent, resolveTarget } from '../core/transform.ts';
import { commandRows } from '../ui/layout.ts';
import { Ui } from '../ui/output.ts';
import { cliCommand } from '../core/runner.ts';

export interface DiffOptions {
  registry?: string;
}

export type FileState = 'same' | 'changed' | 'missing';

export interface FileDiff {
  path: string;
  state: FileState;
  /** The user changed the file since rectio wrote it. */
  editedLocally: boolean;
  patch: string;
}

export interface DiffResult {
  item: string;
  installed: string;
  latest: string;
  files: FileDiff[];
}

/**
 * Compares the installed files of an item with the latest registry version: a unified patch from
 * the local file to the registry file, plus whether the local file was edited since install.
 */
export async function runDiff(
  ctx: CliContext,
  name: string | undefined,
  options: DiffOptions = {},
) {
  if (name === undefined)
    throw new CliError('name an item', `Example: ${cliCommand('diff button')}`);
  const config = requireConfig(ctx.cwd);
  const locked = readLock(ctx.cwd).items[name];
  if (locked === undefined)
    throw new CliError(`${name} is not installed`, `Add it with \`${cliCommand(`add ${name}`)}\`.`);

  const client = createRegistryClient(registryUrl(ctx, options.registry, config));
  const [entry] = (await resolveItems(client, [name])).filter((e) => e.name === name);
  if (entry === undefined) throw new CliError(`${name} is not in the registry`);
  const item = await client.item(entry);
  const roots = readAliasRoots(ctx.cwd);

  const files: FileDiff[] = [];
  for (const file of item.files) {
    const absolute = resolveTarget(file.target, config.aliases, roots);
    if (!isInside(ctx.cwd, absolute))
      throw new CliError(`${file.target} resolves outside the project`);
    const path = toProjectPath(ctx.cwd, absolute);
    const upstream = projectContent(file, config.aliases);
    const local = readNormalized(absolute);
    const recorded = locked.files.find((f) => f.path === path)?.sha256;
    const editedLocally =
      local !== undefined && recorded !== undefined && sha256Hex(local) !== recorded;
    const state: FileState =
      local === undefined ? 'missing' : local === upstream ? 'same' : 'changed';
    const patch =
      state === 'changed'
        ? createTwoFilesPatch(
            `local/${path}`,
            `registry/${path}`,
            local ?? '',
            upstream,
            undefined,
            `${item.name}@${item.version}`,
          )
        : '';
    files.push({ path, state, editedLocally, patch });
  }

  const result: DiffResult = { item: name, installed: locked.version, latest: item.version, files };
  printDiff(new Ui(ctx), result);
  return result;
}

function colorPatch(ui: Ui, patch: string): string[] {
  const { s } = ui;
  return patch
    .trimEnd()
    .split('\n')
    .map((line) => {
      if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('==='))
        return s.bold(line);
      if (line.startsWith('@@')) return s.cyan(line);
      if (line.startsWith('+')) return s.green(line);
      if (line.startsWith('-')) return s.red(line);
      return line;
    });
}

function printDiff(ui: Ui, result: DiffResult): void {
  const { s, g } = ui;
  const upgrade =
    result.installed === result.latest
      ? result.latest
      : `${result.installed} ${g.arrow} ${result.latest}`;
  ui.header('diff', `${result.item} ${upgrade}`);
  const marks: Record<FileState, string> = {
    same: s.dim('='),
    changed: s.yellow('~'),
    missing: s.red(g.fail),
  };
  for (const file of result.files) {
    const note = file.editedLocally ? s.dim('  edited locally') : '';
    const path = file.state === 'same' ? s.dim(file.path) : file.path;
    ui.line(`${marks[file.state]} ${path}${note}`);
  }
  for (const file of result.files) {
    if (file.patch === '') continue;
    // Patches stay flush left, so they can be copied and applied.
    ui.ctx.log('');
    for (const line of colorPatch(ui, file.patch)) ui.ctx.log(line);
  }
  ui.line();
  if (result.files.every((f) => f.state === 'same')) ui.line('No differences.');
  else {
    ui.lines(
      commandRows(
        [[cliCommand(`add ${result.item} --overwrite`), 'take the registry version']],
        s,
        '',
      ),
    );
  }
  ui.end();
}

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
  if (name === undefined) throw new CliError('name an item', 'Example: rectio diff button');
  const config = requireConfig(ctx.cwd);
  const locked = readLock(ctx.cwd).items[name];
  if (locked === undefined)
    throw new CliError(`${name} is not installed`, `Add it with \`rectio add ${name}\`.`);

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
  const upgrade =
    locked.version === item.version ? item.version : `${locked.version} -> ${item.version}`;
  ctx.log(`${name} ${upgrade}`);
  for (const file of files) {
    const note = file.editedLocally ? ' (edited locally)' : '';
    ctx.log(
      `  ${file.state === 'same' ? '=' : file.state === 'missing' ? '!' : '~'} ${file.path}${note}`,
    );
  }
  for (const file of files) if (file.patch !== '') ctx.log(`\n${file.patch.trimEnd()}`);
  if (files.every((f) => f.state === 'same')) ctx.log('No differences.');
  return result;
}

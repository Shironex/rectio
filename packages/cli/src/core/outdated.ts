import type { RegistryIndex } from '@rectio/registry';

import type { Lockfile } from './lockfile.ts';
import { cliCommand } from './runner.ts';

export interface Outdated {
  name: string;
  installed: string;
  latest: string;
}

/** Installed items whose locked version differs from the registry index. No extra requests. */
export function outdatedItems(index: RegistryIndex, lock: Lockfile): Outdated[] {
  const outdated: Outdated[] = [];
  for (const entry of index.items) {
    const locked = lock.items[entry.name];
    if (locked !== undefined && locked.version !== entry.version) {
      outdated.push({ name: entry.name, installed: locked.version, latest: entry.version });
    }
  }
  return outdated;
}

/** The one line after `add` and `list` when installed items have moved on upstream. */
export function outdatedHint(outdated: readonly Outdated[]): string | undefined {
  if (outdated.length === 0) return undefined;
  const count =
    outdated.length === 1
      ? '1 installed item has'
      : `${String(outdated.length)} installed items have`;
  return `${count} a newer version: run \`${cliCommand('update')}\` to list them`;
}

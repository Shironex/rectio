import type { RegistryIndex } from '@rectio/registry';

import type { CliContext } from './context.ts';
import type { Lockfile } from './lockfile.ts';

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

/** One line after `add` and `list` when installed items have moved on upstream. */
export function printOutdatedHint(ctx: CliContext, outdated: readonly Outdated[]): void {
  if (outdated.length === 0) return;
  const count =
    outdated.length === 1 ? '1 installed item has' : `${outdated.length} installed items have`;
  ctx.log(
    `\n${count} a newer version in the registry: run \`rectio update\` to list them, or \`rectio diff <item>\` to review one.`,
  );
}

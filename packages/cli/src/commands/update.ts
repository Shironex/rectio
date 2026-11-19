import { requireConfig, registryUrl } from '../core/config.ts';
import type { CliContext } from '../core/context.ts';
import { readLock } from '../core/lockfile.ts';
import { createRegistryClient } from '../core/registry-client.ts';

export interface Outdated {
  name: string;
  installed: string;
  latest: string;
}

/**
 * The designed stub of `update`: it reports which installed items have a newer version. The
 * three-way merge (base = the locked version fetched by version, ours = the local file, theirs =
 * latest) is planned in the README; until then `rectio diff` plus `rectio add --overwrite` is the
 * manual path.
 */
export async function runUpdate(ctx: CliContext, options: { registry?: string } = {}) {
  const config = requireConfig(ctx.cwd);
  const lock = readLock(ctx.cwd);
  const index = await createRegistryClient(registryUrl(ctx, options.registry, config)).index();
  const outdated: Outdated[] = [];
  for (const entry of index.items) {
    const locked = lock.items[entry.name];
    if (locked !== undefined && locked.version !== entry.version) {
      outdated.push({ name: entry.name, installed: locked.version, latest: entry.version });
    }
  }
  if (outdated.length === 0) ctx.log('Every installed item is on its latest version.');
  for (const item of outdated) ctx.log(`  ${item.name} ${item.installed} -> ${item.latest}`);
  ctx.log(
    '\n`rectio update` does not merge yet. Review with `rectio diff <item>`, then replace with `rectio add <item> --overwrite`.',
  );
  return outdated;
}

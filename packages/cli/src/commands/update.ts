import { requireConfig, registryUrl } from '../core/config.ts';
import type { CliContext } from '../core/context.ts';
import { readLock } from '../core/lockfile.ts';
import { outdatedItems } from '../core/outdated.ts';
import { createRegistryClient } from '../core/registry-client.ts';
import { commandRows, plural } from '../ui/layout.ts';
import { Ui } from '../ui/output.ts';
import { pad } from '../ui/style.ts';
import { cliCommand } from '../core/runner.ts';

/**
 * The designed stub of `update`: it reports which installed items have a newer version. The
 * three-way merge (base = the locked version fetched by version, ours = the local file, theirs =
 * latest) is planned in the README; until then `rectio diff` plus `rectio add --overwrite` is the
 * manual path.
 */
export async function runUpdate(ctx: CliContext, options: { registry?: string } = {}) {
  const ui = new Ui(ctx);
  const config = requireConfig(ctx.cwd);
  const lock = readLock(ctx.cwd);
  const index = await createRegistryClient(registryUrl(ctx, options.registry, config)).index();
  const outdated = outdatedItems(index, lock);
  const { s, g } = ui;
  ui.header(
    'update',
    outdated.length === 0 ? 'up to date' : plural(outdated.length, 'newer version'),
  );
  if (outdated.length === 0) {
    ui.line('Every installed item is on its latest version.');
    ui.end();
    return outdated;
  }
  const width = Math.max(...outdated.map((o) => o.name.length));
  const from = Math.max(...outdated.map((o) => o.installed.length));
  for (const item of outdated) {
    ui.line(
      `${pad(item.name, width)}  ${s.dim(pad(item.installed, from))} ${s.dim(g.arrow)} ${s.cyan(item.latest)}`,
    );
  }
  ui.line();
  ui.tip(`\`${cliCommand('update')}\` does not merge yet. Review and replace by hand:`);
  ui.lines(
    commandRows(
      [
        [cliCommand('diff <item>'), 'see how your copy differs'],
        [cliCommand('add <item> --overwrite'), 'replace it with the latest'],
      ],
      s,
    ),
  );
  ui.end();
  return outdated;
}

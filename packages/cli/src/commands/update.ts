import { requireConfig, registryUrl } from '../core/config.ts';
import type { CliContext } from '../core/context.ts';
import { readLock } from '../core/lockfile.ts';
import type { Lockfile } from '../core/lockfile.ts';
import { outdatedItems, type Outdated } from '../core/outdated.ts';
import { createRegistryClient, type RegistryClient } from '../core/registry-client.ts';
import { fetchTemplate, themeItem } from '../core/theme-link.ts';
import { commandRows, plural } from '../ui/layout.ts';
import { Ui } from '../ui/output.ts';
import { pad } from '../ui/style.ts';
import { cliCommand } from '../core/runner.ts';

/**
 * Generated themes are not in the index: each is rebuilt from its code over today's default theme,
 * and listed when the result differs from what was installed (a newer default theme, or a newer
 * derivation in the CLI).
 */
async function rebuiltThemes(client: RegistryClient, lock: Lockfile): Promise<Outdated[]> {
  const generated = Object.entries(lock.items).filter(([, item]) => item.themeCode !== undefined);
  if (generated.length === 0) return [];
  const template = await fetchTemplate(client);
  return generated.flatMap(([name, locked]) => {
    const rebuilt = themeItem(locked.themeCode ?? '', template);
    if (rebuilt.integrity === locked.integrity) return [];
    const latest =
      rebuilt.version === locked.version ? `${rebuilt.version} rebuilt` : rebuilt.version;
    return [{ name, installed: locked.version, latest, code: locked.themeCode }];
  });
}

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
  const client = createRegistryClient(registryUrl(ctx, options.registry, config));
  const index = await client.index();
  const outdated: Outdated[] = [
    ...outdatedItems(index, lock),
    ...(await rebuiltThemes(client, lock)),
  ];
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
  const themes = outdated.flatMap((o) => (o.code === undefined ? [] : [o]));
  if (themes.length > 0) {
    ui.tip('Generated themes regenerate from their theme code:');
    ui.lines(
      commandRows(
        themes.map((t): [string, string] => [
          cliCommand(`add ${t.code ?? ''} --overwrite`),
          t.name,
        ]),
        s,
      ),
    );
  }
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

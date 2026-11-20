import type { RegistryItem } from '@rectio/registry';

import type { RectioConfig } from '../core/config.ts';
import { CliError, type CliContext } from '../core/context.ts';
import { countDependencies, runInstall, type DependencyChanges } from '../core/install.ts';
import {
  fetchItems,
  pendingDependencies,
  planFiles,
  writeItems,
  type InstallOptions,
  type InstallReport,
  type PlannedFile,
} from '../core/installer.ts';
import { detectPackageManager, type PackageManager } from '../core/project.ts';
import type { RegistryClient } from '../core/registry-client.ts';
import { fetchTemplate, themeItem } from '../core/theme-link.ts';
import { plural } from '../ui/layout.ts';
import type { Steps } from '../ui/output.ts';

export interface InstallStepsHooks {
  /** Runs first in the writing step; returns how many files it wrote itself. */
  beforeWrite?: () => number;
  /** Plan the files in the writing step, after beforeWrite (a template writes its tsconfig first). */
  planWhenWriting?: boolean;
  /** How the resolving step counts what it found: `88 kit items` for a template. */
  itemsLabel?: string;
  /** Theme generator links: each becomes a theme item built locally (see core/theme-link.ts). */
  themeLinks?: readonly string[];
}

/** The items for theme links, built on the registry's default theme, plus what they rest on. */
async function themeItems(
  client: RegistryClient,
  links: readonly string[],
): Promise<RegistryItem[]> {
  if (links.length === 0) return [];
  const template = await fetchTemplate(client);
  const items = links.map((link) => themeItem(link, template));
  const index = await client.index();
  for (const item of items) {
    if (index.items.some((entry) => entry.name === item.name))
      throw new CliError(
        `the registry already has an item called ${item.name}`,
        'Give the theme another name in the theme generator.',
      );
  }
  return items;
}

function itemsNote(items: readonly RegistryItem[], requested: readonly string[]): string {
  const asked = items.filter((item) => requested.includes(item.name)).length;
  return asked === items.length
    ? plural(items.length, 'item')
    : `${plural(items.length, 'item')} (${String(asked)} asked)`;
}

/** The manager for the project, or for the folder a template is about to be written to. */
export const managerFor = (ctx: CliContext): PackageManager =>
  detectPackageManager(ctx.cwd, ctx.env);

/**
 * The three steps every install shares: Resolving items, Writing files, Installing packages.
 * Resolving fetches and verifies everything and plans the files; nothing is written before the
 * writing step, so a failure up to there leaves the project untouched.
 */
export async function installSteps(
  steps: Steps,
  ctx: CliContext,
  config: RectioConfig,
  client: RegistryClient,
  names: readonly string[],
  options: InstallOptions,
  hooks: InstallStepsHooks = {},
): Promise<InstallReport> {
  const dryRun = options.dryRun === true;
  let files: PlannedFile[] = [];
  let requested = [...names];
  const items = await steps.run('Resolving items', async (step) => {
    const generated = await themeItems(client, hooks.themeLinks ?? []);
    requested = [...names, ...generated.map((item) => item.name)];
    const wanted = [...names, ...generated.flatMap((item) => item.registryDependencies)];
    const fetched = [
      ...(wanted.length === 0 ? [] : await fetchItems(client, wanted)),
      ...generated,
    ];
    if (hooks.planWhenWriting !== true) files = planFiles(ctx, config, fetched, options.overwrite);
    step.note =
      hooks.itemsLabel === undefined
        ? itemsNote(fetched, requested)
        : plural(fetched.length, hooks.itemsLabel);
    return fetched;
  });

  let added: DependencyChanges;
  if (dryRun) {
    steps.skip('Writing files', 'dry run');
    added = pendingDependencies(ctx.cwd, items);
  } else {
    added = await steps.run('Writing files', (step) => {
      steps.changed = true;
      const own = hooks.beforeWrite?.() ?? 0;
      if (hooks.planWhenWriting === true) {
        files = planFiles(ctx, config, items, options.overwrite);
      }
      const changes = writeItems(ctx, config, items, files);
      const count = own + files.filter((f) => f.action !== 'unchanged').length;
      const same = files.filter((f) => f.action === 'unchanged').length;
      step.note = [
        count > 0 || same === 0 ? plural(count, 'file') : '',
        same > 0 ? `${String(same)} up to date` : '',
      ]
        .filter((part) => part !== '')
        .join(', ');
      return changes;
    });
  }

  const count = countDependencies(added);
  let manager: PackageManager | undefined;
  if (dryRun) steps.skip('Installing packages', 'dry run');
  else if (count === 0) steps.skip('Installing packages', 'nothing new');
  else if (options.install === false) steps.skip('Installing packages', '--no-install');
  else {
    const chosen = options.manager ?? managerFor(ctx);
    await steps.run('Installing packages', async (step) => {
      await runInstall(ctx.cwd, chosen);
      step.note = `${chosen}, ${plural(count, 'package')}`;
    });
    manager = chosen;
  }
  return { requested, items, files, added, dryRun, manager };
}

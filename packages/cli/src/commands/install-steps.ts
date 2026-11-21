import type { RegistryItem } from '@rectio/registry';

import type { RectioConfig } from '../core/config.ts';
import type { CliContext } from '../core/context.ts';
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
import { plural } from '../ui/layout.ts';
import type { Steps } from '../ui/output.ts';

export interface InstallStepsHooks {
  /** Runs first in the writing step; returns how many files it wrote itself. */
  beforeWrite?: () => number;
  /** Plan the files in the writing step, after beforeWrite (a template writes its tsconfig first). */
  planWhenWriting?: boolean;
  /** How the resolving step counts what it found: `88 kit items` for a template. */
  itemsLabel?: string;
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
  const items = await steps.run('Resolving items', async (step) => {
    const fetched = await fetchItems(client, names);
    if (hooks.planWhenWriting !== true) files = planFiles(ctx, config, fetched, options.overwrite);
    step.note =
      hooks.itemsLabel === undefined
        ? itemsNote(fetched, names)
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
  return { requested: [...names], items, files, added, dryRun, manager };
}

import { requireConfig, registryUrl } from '../core/config.ts';
import { CliError, type CliContext } from '../core/context.ts';
import { countDependencies } from '../core/install.ts';
import { installItems, type InstallOptions, type InstallReport } from '../core/installer.ts';
import { createRegistryClient } from '../core/registry-client.ts';

export interface AddOptions extends InstallOptions {
  registry?: string;
}

/** Prints what an install did, or would do with --dry-run. */
export function printReport(ctx: CliContext, report: InstallReport): void {
  const verb = report.dryRun ? 'Would install' : 'Installed';
  ctx.log(`${verb} ${report.items.map((i) => `${i.name}@${i.version}`).join(', ')}`);
  for (const file of report.files) {
    if (file.action === 'unchanged') continue;
    ctx.log(`  ${file.action === 'create' ? '+' : '~'} ${file.path}`);
  }
  const unchanged = report.files.filter((f) => f.action === 'unchanged').length;
  if (unchanged > 0) ctx.log(`  ${unchanged} file(s) already up to date`);
  const deps = { ...report.added.dependencies, ...report.added.devDependencies };
  if (countDependencies(report.added) > 0) {
    ctx.log(`  ${report.dryRun ? 'would add' : 'added'} packages: ${Object.keys(deps).join(', ')}`);
  }
  if (!report.dryRun) {
    for (const item of report.items)
      if (item.docs !== undefined) ctx.log(`\n${item.name}: ${item.docs}`);
  }
}

export async function runAdd(ctx: CliContext, names: readonly string[], options: AddOptions = {}) {
  if (names.length === 0)
    throw new CliError('name at least one item', 'Example: rectio add button');
  const config = requireConfig(ctx.cwd);
  const client = createRegistryClient(registryUrl(ctx, options.registry, config));
  const report = await installItems(ctx, config, client, names, options);
  printReport(ctx, report);
  if (!report.dryRun && options.install === false && countDependencies(report.added) > 0) {
    ctx.log('\nPackages were added to package.json: run your package manager install.');
  }
  return report;
}

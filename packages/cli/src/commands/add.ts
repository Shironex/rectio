import { requireConfig, registryUrl } from '../core/config.ts';
import { CliError, type CliContext } from '../core/context.ts';
import type { InstallOptions, InstallReport } from '../core/installer.ts';
import { readLock } from '../core/lockfile.ts';
import { outdatedHint, outdatedItems } from '../core/outdated.ts';
import { createRegistryClient } from '../core/registry-client.ts';
import { plural } from '../ui/layout.ts';
import { Ui, type OutputOptions } from '../ui/output.ts';
import {
  deprecationWarnings,
  installRows,
  printVerbose,
  rowLines,
  tipLines,
  type Rows,
} from '../ui/report.ts';
import { CLI_VERSION } from '../version.ts';
import { installSteps, managerFor } from './install-steps.ts';

export interface AddOptions extends InstallOptions, OutputOptions {
  registry?: string;
}

/** `Added dialog and 3 dependencies`, or what a dry run would do. */
function resultLine(report: InstallReport): string {
  const asked = report.requested.join(', ');
  const deps = report.items.length - report.requested.length;
  const tail = deps > 0 ? ` and ${plural(deps, 'dependency', 'dependencies')}` : '';
  if (report.dryRun) return `Dry run: nothing was written (${asked}${tail})`;
  if (report.files.every((f) => f.action === 'unchanged') && report.manager === undefined) {
    return `${asked} ${report.requested.length === 1 ? 'is' : 'are'} already up to date`;
  }
  return `Added ${asked}${tail}`;
}

export async function runAdd(ctx: CliContext, names: readonly string[], options: AddOptions = {}) {
  const ui = new Ui(ctx, options);
  ui.header('add', CLI_VERSION);
  const steps = ui.steps(4);
  const { config, client } = await steps.run('Checking project', (step) => {
    if (names.length === 0)
      throw new CliError('name at least one item', 'Example: rectio add button');
    const found = requireConfig(ctx.cwd);
    step.note = `${found.framework}, ${found.css}`;
    return {
      config: found,
      client: createRegistryClient(registryUrl(ctx, options.registry, found)),
    };
  });
  const report = await installSteps(steps, ctx, config, client, names, options);
  printVerbose(ui, report);

  const { s } = ui;
  const versions = report.items
    .filter((item) => report.requested.includes(item.name))
    .map((item) => `${item.name} ${s.dim(item.version)}`);
  const deps = report.items.length - report.requested.length;
  const rows: Rows = [['Items', versions.join(', ')]];
  if (deps > 0) rows.push(['', s.dim(`+ ${plural(deps, 'dependency', 'dependencies')}`)]);
  rows.push(...installRows(report, s, { manager: managerFor(ctx) }));
  const lines = [resultLine(report), '', ...rowLines(rows, s)];
  if (!report.dryRun) {
    const tips = tipLines(report, s);
    // The index is already fetched for the install, so this costs no request.
    const hint = outdatedHint(outdatedItems(await client.index(), readLock(ctx.cwd)));
    if (tips.length > 0 || hint !== undefined) lines.push('');
    lines.push(...tips);
    if (hint !== undefined) lines.push(s.dim(`${ui.g.warn} ${hint}`));
  }
  ui.summary(lines);
  for (const warning of deprecationWarnings(report)) ui.warning(warning);
  return report;
}

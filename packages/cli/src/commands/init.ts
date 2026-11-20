import { join } from 'node:path';

import {
  CONFIG_FILE,
  FRAMEWORKS,
  readConfig,
  registryUrl,
  writeConfig,
  type Framework,
  type RectioConfig,
} from '../core/config.ts';
import { CliError, type CliContext } from '../core/context.ts';
import { readText } from '../core/fs.ts';
import type { InstallOptions } from '../core/installer.ts';
import {
  checkTailwind,
  detectFramework,
  findCssEntry,
  importsTailwind,
  readAliasRoots,
  readPackageJson,
} from '../core/project.ts';
import { createRegistryClient } from '../core/registry-client.ts';
import { commandRows } from '../ui/layout.ts';
import { Ui, type OutputOptions, type StepHandle } from '../ui/output.ts';
import { installRows, printVerbose, rowLines, tipLines, type Rows } from '../ui/report.ts';
import { CLI_VERSION } from '../version.ts';
import { installSteps, managerFor } from './install-steps.ts';

export interface InitOptions extends InstallOptions, OutputOptions {
  registry?: string;
  theme?: string;
  css?: string;
  framework?: string;
  /** Rewrite rectio.json even if it exists. */
  force?: boolean;
}

/** What init installs: the tokens (which pull in the default theme), the chosen theme and cn. */
export function baseItems(theme: string): string[] {
  return ['tokens', `theme-${theme}`, 'cn'];
}

function aliasHint(framework: Framework): string {
  const tsconfig = 'tsconfig.json: "compilerOptions": { "paths": { "@/*": ["./src/*"] } }';
  if (framework === 'next') return `Add ${tsconfig.replace('./src/*', './*')} (Next reads it).`;
  return `Add ${tsconfig}, and the same alias to vite.config (resolve.alias "@" -> ./src).`;
}

export async function runInit(ctx: CliContext, options: InitOptions = {}) {
  const ui = new Ui(ctx, options);
  ui.header('init', CLI_VERSION);
  const steps = ui.steps(4);
  const checked = await steps.run('Checking project', (step) => checkProject(ctx, options, step));
  const { existing, framework, tailwind, client } = checked;
  const final = checked.config;

  const writeConfigFile =
    existing === undefined || options.force === true || existing.theme !== final.theme;
  const report = await installSteps(steps, ctx, final, client, baseItems(final.theme), options, {
    itemsLabel: 'item',
    beforeWrite: () => {
      if (!writeConfigFile) return 0;
      writeConfig(ctx.cwd, final);
      return 1;
    },
  });
  printVerbose(ui, report);

  const { s } = ui;
  const rows: Rows = [
    ['Config', `${CONFIG_FILE}${writeConfigFile ? '' : s.dim(' (kept)')}`],
    ['Theme', final.theme],
    ['Tailwind', tailwind.version],
    ...installRows(report, s, { manager: managerFor(ctx) }),
  ];
  const lines = [
    report.dryRun
      ? `Dry run: nothing was written (rectio for ${framework})`
      : `Set up rectio for ${framework}`,
    '',
    ...rowLines(rows, s),
  ];
  if (!report.dryRun) {
    // A non-default theme's usage note (data-theme) comes from its item.
    const tips = tipLines(report, s);
    if (tips.length > 0) lines.push('', ...tips);
    lines.push(
      '',
      s.bold('Next'),
      ...commandRows(
        [
          ['rectio add button', 'add a component and what it needs'],
          ['rectio list', 'browse every item'],
        ],
        s,
      ),
    );
  }
  ui.summary(lines);
  return { config: final, report };
}

/** The Checking project step: framework, Tailwind, the CSS entry, the alias and the theme. */
async function checkProject(ctx: CliContext, options: InitOptions, step: StepHandle) {
  const pkg = readPackageJson(ctx.cwd);
  const existing = readConfig(ctx.cwd);

  if (
    options.framework !== undefined &&
    !(FRAMEWORKS as readonly string[]).includes(options.framework)
  ) {
    throw new CliError(
      `unknown framework "${options.framework}"`,
      `Use one of: ${FRAMEWORKS.join(', ')}.`,
    );
  }
  const framework =
    (options.framework as Framework | undefined) ??
    existing?.framework ??
    detectFramework(ctx.cwd, pkg);
  if (framework === undefined) {
    throw new CliError(
      'could not detect Vite, Next.js or TanStack Start',
      `Pass --framework ${FRAMEWORKS.join('|')}.`,
    );
  }
  const tailwind = checkTailwind(ctx.cwd, pkg, framework);
  step.warnings.push(...tailwind.warnings);

  const css = options.css ?? existing?.css ?? findCssEntry(ctx.cwd);
  if (css === undefined) {
    throw new CliError(
      'found no CSS file with @import "tailwindcss"',
      'Create one (for example src/index.css), or pass --css <path>.',
    );
  }
  const cssText = readText(join(ctx.cwd, css));
  if (cssText === undefined) throw new CliError(`${css} does not exist`);
  if (!importsTailwind(cssText))
    throw new CliError(`${css} does not import Tailwind`, 'Add @import "tailwindcss"; at the top.');

  const roots = readAliasRoots(ctx.cwd);
  const root = roots.find((r) => r.prefix === '@/') ?? roots[0];
  if (root === undefined && existing === undefined) {
    throw new CliError('found no import alias in tsconfig.json', aliasHint(framework));
  }
  const prefix = root?.prefix ?? '@/';

  const config: RectioConfig =
    existing !== undefined && options.force !== true
      ? existing
      : {
          schemaVersion: 1,
          registry: registryUrl(ctx, options.registry, existing),
          framework,
          css,
          theme: options.theme ?? existing?.theme ?? 'default',
          aliases: {
            ui: `${prefix}components/ui`,
            blocks: `${prefix}components/blocks`,
            lib: `${prefix}lib`,
            hooks: `${prefix}hooks`,
            styles: `${prefix}styles/rectio`,
          },
        };
  const theme = options.theme ?? config.theme;
  const client = createRegistryClient(registryUrl(ctx, options.registry, config));
  const index = await client.index();
  if (!index.items.some((i) => i.name === `theme-${theme}` && i.type === 'theme')) {
    const themes = index.items.filter((i) => i.type === 'theme').map((i) => i.name.slice(6));
    throw new CliError(`unknown theme "${theme}"`, `Available: ${themes.join(', ')}.`);
  }
  step.note = `${framework}, Tailwind ${tailwind.version}, ${css}`;
  return { existing, framework, tailwind, client, config: { ...config, theme } };
}

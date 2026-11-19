import { existsSync } from 'node:fs';
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
import { installItems, type InstallOptions } from '../core/installer.ts';
import {
  checkTailwind,
  detectFramework,
  findCssEntry,
  importsTailwind,
  readAliasRoots,
  readPackageJson,
} from '../core/project.ts';
import { createRegistryClient } from '../core/registry-client.ts';
import { printReport } from './add.ts';

export interface InitOptions extends InstallOptions {
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
  for (const warning of tailwind.warnings) ctx.warn(`warning: ${warning}`);

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
  const final = { ...config, theme };

  const report = await installItems(ctx, final, client, baseItems(theme), options);
  if (
    !report.dryRun &&
    (existing === undefined || options.force === true || existing.theme !== theme)
  ) {
    writeConfig(ctx.cwd, final);
  }
  const wrote = existsSync(join(ctx.cwd, CONFIG_FILE));
  ctx.log(
    `${report.dryRun ? 'Would set up' : 'Set up'} rectio for ${framework} (Tailwind ${tailwind.version}).`,
  );
  printReport(ctx, report);
  if (!report.dryRun && wrote) {
    ctx.log(`\nConfig: ${CONFIG_FILE}. Add components with \`rectio add button\`.`);
    if (theme !== 'default')
      ctx.log(`Set data-theme="${theme}" on <html> to use the ${theme} theme.`);
  }
  return { config: final, report };
}

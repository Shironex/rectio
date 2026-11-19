import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { runAdd } from './commands/add.ts';
import { runDiff } from './commands/diff.ts';
import { runInit } from './commands/init.ts';
import { runList, runSearch } from './commands/list.ts';
import { runUpdate } from './commands/update.ts';
import { CliError, type CliContext } from './core/context.ts';

const HELP = `rectio: finance and back-office components, copied into your project

Usage: rectio <command> [options]

Commands
  init                 Set up rectio: rectio.json, tokens, a theme and the cn helper
  add <items...>       Add items and everything they depend on
  diff <item>          Compare an installed item with the registry
  list                 List registry items (--type, --tier)
  search <query>       Search registry items
  update               Show items with a newer version (merging is not built yet)

Options
  --cwd <dir>          Project folder (default: the current folder)
  --registry <url>     Registry URL or folder (also RECTIO_REGISTRY_URL)
  --theme <id>         init: theme to install (default: default)
  --css <path>         init: CSS file that imports Tailwind
  --framework <name>   init: vite, next or tanstack-start, when detection fails
  --force              init: rewrite rectio.json
  --overwrite          add: replace files you changed
  --dry-run            init, add: show the plan, write nothing
  --no-install         init, add: do not run the package manager
  --type <type>        list: component, block, theme, lib, hook or style
  --tier <tier>        list: free or pro
  -h, --help           Show this help
  -v, --version        Show the version

Pro items read the license key from RECTIO_LICENSE_KEY or the auth.json file in your user
config folder. It is never stored in the project.`;

const OPTIONS = {
  cwd: { type: 'string' },
  registry: { type: 'string' },
  theme: { type: 'string' },
  css: { type: 'string' },
  framework: { type: 'string' },
  type: { type: 'string' },
  tier: { type: 'string' },
  force: { type: 'boolean' },
  overwrite: { type: 'boolean' },
  'dry-run': { type: 'boolean' },
  'no-install': { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
} as const;

function version(): string {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
    version: string;
  };
  return pkg.version;
}

/** Runs one CLI invocation and returns the exit code. Never calls process.exit itself. */
export async function main(argv: readonly string[], base: CliContext): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({ args: [...argv], options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    base.warn(`error: ${(error as Error).message}\n\nRun \`rectio --help\` for usage.`);
    return 1;
  }
  const { values, positionals } = parsed;
  const [command, ...rest] = positionals;
  if (values.version === true) {
    base.log(version());
    return 0;
  }
  if (values.help === true || command === undefined) {
    base.log(HELP);
    return command === undefined && values.help !== true ? 1 : 0;
  }

  const ctx: CliContext = { ...base, cwd: resolve(base.cwd, values.cwd ?? '.') };
  const shared = {
    ...(values.registry === undefined ? {} : { registry: values.registry }),
  };
  const install = {
    ...shared,
    dryRun: values['dry-run'] === true,
    install: values['no-install'] !== true,
  };
  try {
    switch (command) {
      case 'init':
        await runInit(ctx, {
          ...install,
          force: values.force === true,
          ...(values.theme === undefined ? {} : { theme: values.theme }),
          ...(values.css === undefined ? {} : { css: values.css }),
          ...(values.framework === undefined ? {} : { framework: values.framework }),
        });
        return 0;
      case 'add':
        await runAdd(ctx, rest, { ...install, overwrite: values.overwrite === true });
        return 0;
      case 'diff':
        await runDiff(ctx, rest[0], shared);
        return 0;
      case 'list':
        await runList(ctx, {
          ...shared,
          ...(values.type === undefined ? {} : { type: values.type }),
          ...(values.tier === undefined ? {} : { tier: values.tier }),
        });
        return 0;
      case 'search':
        await runSearch(ctx, rest.join(' '), shared);
        return 0;
      case 'update':
        await runUpdate(ctx, shared);
        return 0;
      default:
        base.warn(`error: unknown command "${command}"\n\nRun \`rectio --help\` for usage.`);
        return 1;
    }
  } catch (error) {
    if (error instanceof CliError) {
      base.warn(`error: ${error.message}`);
      if (error.hint !== undefined) base.warn(error.hint);
      return 1;
    }
    throw error;
  }
}

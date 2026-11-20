import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { runAdd } from './commands/add.ts';
import { runDiff } from './commands/diff.ts';
import { runInit } from './commands/init.ts';
import { runInitTemplate } from './commands/init-template.ts';
import { runList, runSearch } from './commands/list.ts';
import { runMcp } from './commands/mcp.ts';
import { runUpdate } from './commands/update.ts';
import { CliError, type CliContext } from './core/context.ts';
import { startUpdateCheck, updateNotice } from './core/update-check.ts';
import { commandRows } from './ui/layout.ts';
import { printError, Ui } from './ui/output.ts';
import { CLI_VERSION } from './version.ts';
import { cliCommand, detectRunner, setRunner } from './core/runner.ts';

type HelpRows = [string, string][];

const COMMANDS: HelpRows = [
  ['init', 'set up rectio: rectio.json, tokens, a theme and the cn helper'],
  ['init --template <name> [folder]', 'start a new project from a template'],
  ['add <items...>', 'add items and everything they depend on'],
  ['diff <item>', 'compare an installed item with the registry'],
  ['list', 'list registry items (--type, --templates)'],
  ['search <query>', 'search registry items'],
  ['update', 'show items with a newer version (merging is not built yet)'],
  ['mcp', 'run the read-only MCP server on stdio, for coding agents'],
];

const FLAGS: HelpRows = [
  ['--cwd <dir>', 'project folder (default: the current folder)'],
  ['--registry <url>', 'registry URL or folder (also RECTIO_REGISTRY_URL)'],
  ['--theme <id>', 'init: theme to install (default: default)'],
  ['--css <path>', 'init: CSS file that imports Tailwind'],
  ['--framework <name>', 'init: vite, next or tanstack-start, when detection fails'],
  ['--template <name>', 'init: create a new project from this template, in [folder]'],
  ['--force', 'init: rewrite rectio.json, or use a folder that is not empty'],
  ['--overwrite', 'add: replace files you changed'],
  ['--dry-run', 'init, add: show the plan, write nothing'],
  ['--no-install', 'init, add: do not run the package manager'],
  ['--verbose', 'init, add: list every item, file and package'],
  ['-q, --quiet', 'init, add: print only the result line and errors'],
  ['--type <type>', 'list: component, block, theme, lib, hook or style'],
  ['--templates', 'list: templates only'],
  ['-h, --help', 'show this help'],
  ['-v, --version', 'show the version'],
];

const ENVIRONMENT: HelpRows = [
  ['RECTIO_REGISTRY_URL', 'registry URL or folder, when --registry is not given'],
  ['RECTIO_NO_UPDATE_CHECK=1', 'do not check npm for a newer rectio'],
  ['NO_COLOR, FORCE_COLOR', 'turn colors off or on'],
];

function help(ui: Ui): string[] {
  const { s } = ui;
  const section = (title: string, rows: HelpRows) => ['', s.bold(title), ...commandRows(rows, s)];
  return [
    `${s.bold('rectio')}  ${s.dim(CLI_VERSION)}`,
    s.dim('Finance and back-office components, copied into your project.'),
    '',
    `Usage: ${s.cyan(cliCommand('<command> [options]'))}`,
    ...section('Commands', COMMANDS),
    ...section('Options', FLAGS),
    ...section('Environment', ENVIRONMENT),
  ];
}

/** The update notice in the same language as the rest: a dim box-free block on stderr. */
function renderNotice(ui: Ui) {
  return (current: string, latest: string, how: string, note?: string): string => {
    if (!ui.term.fancy) return updateNotice(current, latest, how, note);
    const { s } = ui;
    return [
      `  ${s.yellow(ui.g.warn)} rectio ${s.bold(latest)} is available ${s.dim(`(you have ${current})`)}`,
      `    ${s.dim('Update with')}  ${s.cyan(how)}`,
      ...(note === undefined ? [] : [`    ${s.dim(note)}`]),
      '',
    ].join('\n');
  };
}

const usageHint = () => `Run \`${cliCommand('--help')}\` for usage.`;

const OPTIONS = {
  cwd: { type: 'string' },
  registry: { type: 'string' },
  theme: { type: 'string' },
  css: { type: 'string' },
  framework: { type: 'string' },
  type: { type: 'string' },
  template: { type: 'string' },
  templates: { type: 'boolean' },
  force: { type: 'boolean' },
  overwrite: { type: 'boolean' },
  'dry-run': { type: 'boolean' },
  'no-install': { type: 'boolean' },
  verbose: { type: 'boolean' },
  quiet: { type: 'boolean', short: 'q' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
} as const;

type ParsedValues = ReturnType<typeof parseArgs<{ options: typeof OPTIONS }>>['values'];

/** Runs one CLI invocation and returns the exit code. Never calls process.exit itself. */
export async function main(argv: readonly string[], base: CliContext): Promise<number> {
  // Every command printed for the user follows how the CLI was started (pnpm dlx, npx, rectio).
  setRunner(base.runner ?? detectRunner(fileURLToPath(import.meta.url), base.env));
  let parsed;
  try {
    parsed = parseArgs({ args: [...argv], options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    printError(base, new CliError((error as Error).message, usageHint()));
    return 1;
  }
  const { values, positionals } = parsed;
  const [command, ...rest] = positionals;
  if (values.version === true) {
    base.log(CLI_VERSION);
    return 0;
  }
  const ui = new Ui(base);
  if (values.help === true || command === undefined) {
    for (const line of help(ui)) base.log(line);
    return command === undefined && values.help !== true ? 1 : 0;
  }

  // Runs beside the command and adds at most its timeout to the end of it. Off in `mcp`.
  const notice = startUpdateCheck({
    current: CLI_VERSION,
    command,
    env: base.env,
    isTTY: base.stdoutIsTTY === true,
    render: renderNotice(ui),
  });
  const code = await runCommand(command, rest, values, base);
  const text = await notice;
  if (text !== undefined) base.warn(text);
  return code;
}

async function runCommand(
  command: string,
  rest: readonly string[],
  values: ParsedValues,
  base: CliContext,
): Promise<number> {
  const ctx: CliContext = { ...base, cwd: resolve(base.cwd, values.cwd ?? '.') };
  const shared = {
    ...(values.registry === undefined ? {} : { registry: values.registry }),
  };
  const output = { quiet: values.quiet === true, verbose: values.verbose === true };
  const install = {
    ...shared,
    ...output,
    dryRun: values['dry-run'] === true,
    install: values['no-install'] !== true,
  };
  try {
    switch (command) {
      case 'init':
        if (values.template !== undefined) {
          if (rest.length > 1) throw new CliError('init --template takes one folder name');
          await runInitTemplate(ctx, values.template, {
            ...install,
            force: values.force === true,
            ...(rest[0] === undefined ? {} : { dir: rest[0] }),
            ...(values.theme === undefined ? {} : { theme: values.theme }),
          });
          return 0;
        }
        if (rest.length > 0) {
          throw new CliError(
            `init takes no folder without --template (got "${rest.join(' ')}")`,
            'Run it in the project root, or pass --cwd <dir>.',
          );
        }
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
          templates: values.templates === true,
        });
        return 0;
      case 'search':
        await runSearch(ctx, rest.join(' '), shared);
        return 0;
      case 'update':
        await runUpdate(ctx, shared);
        return 0;
      case 'mcp':
        await runMcp(ctx, shared);
        return 0;
      default:
        throw new CliError(`unknown command "${command}"`, usageHint());
    }
  } catch (error) {
    if (error instanceof CliError) {
      printError(base, error);
      return 1;
    }
    throw error;
  }
}

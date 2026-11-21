import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

import type { IndexEntry } from '@rectio/registry';

import {
  FRAMEWORKS,
  readConfig,
  registryUrl,
  type Framework,
  type RectioConfig,
} from '../core/config.ts';
import { CliError, type CliContext } from '../core/context.ts';
import { readText, toProjectPath } from '../core/fs.ts';
import {
  checkTailwind,
  detectFramework,
  findCssEntry,
  importsTailwind,
  readAliasRoots,
  readPackageJson,
  resolveAlias,
  type PackageManager,
} from '../core/project.ts';
import { createRegistryClient } from '../core/registry-client.ts';
import { cliCommand } from '../core/runner.ts';
import { commandExists, insideGitRepo } from '../core/system.ts';
import { resolveThemeSource, THEME_GENERATOR_URL, type ThemeSource } from '../core/theme-source.ts';
import type { Choice, Prompter } from '../prompt/prompts.ts';
import type { PromptIO } from '../prompt/session.ts';
import type { Ui } from '../ui/output.ts';
import { CLI_VERSION } from '../version.ts';
import { runAdd } from './add.ts';
import { aliasHint, defaultAliases, runInit, type InitOptions } from './init.ts';
import { runInitTemplate, type InitTemplateOptions } from './init-template.ts';
import { managerFor } from './install-steps.ts';

export const TEMPLATES_URL = 'https://shironex.github.io/rectio/templates';

/** The starter components offered when rectio joins an existing app, in this order. */
export const STARTER_COMPONENTS = [
  'button',
  'field',
  'select',
  'dialog',
  'card',
  'badge',
  'tabs',
  'data-table',
  'money',
] as const;

const MANAGERS: readonly PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];

const FRAMEWORK_LABELS: Record<Framework, string> = {
  vite: 'Vite',
  next: 'Next.js',
  'tanstack-start': 'TanStack Start',
};

/** The flags that answer a question, so it is not asked. Undefined means the flag was not given. */
export interface InitFlags {
  registry?: string;
  theme?: string;
  pm?: PackageManager;
  /** False for --no-install. */
  install?: boolean;
  /** --git or --no-git. */
  git?: boolean;
  force: boolean;
  dryRun: boolean;
  quiet: boolean;
  verbose: boolean;
}

/**
 * The terminal to ask in, or undefined when rectio must not ask: both ends a real terminal,
 * outside CI and TERM=dumb.
 */
export function promptIO(ctx: CliContext, columns: number): PromptIO | undefined {
  const ci = ctx.env.CI;
  const inCi = ci !== undefined && ci !== '' && ci !== '0' && ci.toLowerCase() !== 'false';
  const { stdin, write } = ctx;
  if (stdin?.isTTY !== true || ctx.stdoutIsTTY !== true || write === undefined) return undefined;
  if (inCi || ctx.env.TERM === 'dumb') return undefined;
  return { input: stdin, write, columns };
}

const NPM_NAME = /^[a-z0-9~][a-z0-9._~-]*$/;

/** Why a folder cannot take a new app, or undefined when it can. */
export function folderProblem(cwd: string, input: string, force = false): string | undefined {
  const value = input.trim();
  if (value === '') return 'enter a folder name';
  const root = resolve(cwd, value);
  const name = basename(root);
  if (name.length > 214 || !NPM_NAME.test(name) || name === 'node_modules') {
    return `"${name}" is not a valid package name: use lowercase letters, digits, - . _ or ~`;
  }
  if (!existsSync(root)) return undefined;
  if (!statSync(root).isDirectory()) return `${value} is a file`;
  if (readdirSync(root).length > 0 && !force) return `${value} is not empty, pick another name`;
  return undefined;
}

/** The template name, or the first `name-2`, `name-3` that is free. */
export function freeFolder(cwd: string, name: string): string {
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? name : `${name}-${String(n)}`;
    if (folderProblem(cwd, candidate) === undefined) return candidate;
  }
}

const CATEGORY_NOUNS: Record<string, string> = {
  app: 'app',
  dashboard: 'dashboard',
  marketing: 'marketing site',
  docs: 'docs site',
};

/** `Next.js marketing site`: every template is a Next.js app (the registry schema allows only next). */
export function stackOf(entry: Pick<IndexEntry, 'categories'>): string {
  const category = entry.categories.find((c) => c !== 'template');
  return `Next.js ${CATEGORY_NOUNS[category ?? 'app'] ?? category ?? 'app'}`;
}

/** The first clause of a description: `A finance back office with a sidebar and command menu`. */
export function shortDescription(text: string): string {
  return (text.split(/[:.]/)[0] ?? text).trim();
}

/** What init found in the existing app, for the first choice and the questions after it. */
interface Detected {
  framework: Framework | undefined;
  tailwind: string | undefined;
  css: string | undefined;
}

function detect(ctx: CliContext): Detected {
  const pkg = readPackageJson(ctx.cwd);
  const framework = detectFramework(ctx.cwd, pkg);
  let tailwind: string | undefined;
  try {
    tailwind = checkTailwind(ctx.cwd, pkg, framework ?? 'vite').version;
  } catch {
    tailwind = undefined;
  }
  return { framework, tailwind, css: findCssEntry(ctx.cwd) };
}

function detectedHint(found: Detected): string {
  const framework =
    found.framework === undefined ? 'no framework found' : FRAMEWORK_LABELS[found.framework];
  const tailwind = found.tailwind === undefined ? 'no Tailwind 4' : `Tailwind ${found.tailwind}`;
  return `${framework}, ${tailwind}`;
}

/**
 * `rectio init` in a terminal with no deciding flag: asks what to do, then the questions for that
 * branch, prints a one-line recap and runs the same steps as the flag forms. A cancel anywhere
 * rejects with PromptCancelled before anything is written.
 */
export async function runInteractiveInit(
  ctx: CliContext,
  flags: InitFlags,
  ask: Prompter,
  ui: Ui,
): Promise<void> {
  ui.header('init', CLI_VERSION);
  const hasPackage = existsSync(join(ctx.cwd, 'package.json'));
  if (!hasPackage) {
    ui.line(ui.s.dim('No package.json in this folder, so rectio starts a new app here.'));
    ui.line();
    await templateFlow(ctx, flags, ask, ui);
    return;
  }
  const found = detect(ctx);
  const mode = await ask.select({
    message: 'Get started',
    choices: [
      { value: 'existing', label: 'Add rectio to this project', hint: detectedHint(found) },
      { value: 'template', label: 'Start a new app from a template', hint: 'a whole Next.js app' },
    ],
  });
  if (mode === 'template') await templateFlow(ctx, flags, ask, ui);
  else await existingFlow(ctx, flags, ask, ui, found);
}

/** default, or a theme pasted from the generator, through the one seam for theme URLs. */
async function askTheme(ask: Prompter): Promise<ThemeSource> {
  const pick = await ask.select({
    message: 'Theme',
    choices: [
      { value: 'default', label: 'default', hint: 'light and dark' },
      { value: 'url', label: 'Paste a theme URL', hint: 'made in the theme generator' },
    ],
    note: [`Design a theme at ${THEME_GENERATOR_URL}`],
  });
  if (pick === 'default') return { kind: 'registry', id: 'default' };
  const url = await ask.text({
    message: 'Theme URL',
    validate: (value) => {
      if (!/^https?:\/\//i.test(value)) return 'paste the URL from the generator (https://...)';
      const result = resolveThemeSource(value);
      return result.ok ? undefined : result.message;
    },
  });
  const result = resolveThemeSource(url);
  if (!result.ok) throw new CliError(result.message);
  return result.source;
}

const themeId = (source: ThemeSource) => (source.kind === 'registry' ? source.id : 'default');

/** After the setup: a theme URL goes through `rectio add <theme-url>`, as if typed by hand. */
async function applyThemeUrl(ctx: CliContext, source: ThemeSource, flags: InitFlags) {
  if (source.kind !== 'url' || flags.dryRun) return;
  await runAdd(ctx, [source.url], {
    ...(flags.registry === undefined ? {} : { registry: flags.registry }),
    install: flags.install !== false,
    quiet: flags.quiet,
    ...(flags.pm === undefined ? {} : { manager: flags.pm }),
  });
}

function recap(ui: Ui, parts: readonly string[]): void {
  ui.line();
  ui.line(`${ui.s.cyan(ui.g.arrow)} ${parts.join(ui.s.dim(', '))}`);
  ui.line();
}

async function templateFlow(ctx: CliContext, flags: InitFlags, ask: Prompter, ui: Ui) {
  const client = createRegistryClient(registryUrl(ctx, flags.registry, undefined));
  const templates = (await client.index()).items.filter((e) => e.type === 'template');
  if (templates.length === 0) throw new CliError('the registry has no templates yet');
  const choices: Choice<string>[] = templates.map((entry: IndexEntry) => ({
    value: entry.name,
    label: entry.title,
    hint: `${entry.name}${ui.term.utf8 ? ' · ' : ', '}${stackOf(entry)}`,
    description: shortDescription(entry.description),
  }));
  const name = await ask.select({
    message: 'Template',
    choices,
    filter: true,
    note: [`Preview them live at ${TEMPLATES_URL}`],
  });

  const folder = await ask.text({
    message: 'Project folder',
    initial: freeFolder(ctx.cwd, name),
    validate: (value) => folderProblem(ctx.cwd, value, flags.force),
  });
  const root = resolve(ctx.cwd, folder);
  const shown = toProjectPath(ctx.cwd, root) || '.';

  const theme: ThemeSource =
    flags.theme === undefined ? await askTheme(ask) : { kind: 'registry', id: flags.theme };

  const detected = managerFor({ ...ctx, cwd: root });
  const manager =
    flags.pm ??
    (await ask.select<PackageManager>({
      message: 'Package manager',
      choices: MANAGERS.map((pm) => ({
        value: pm,
        label: pm,
        ...(pm === detected ? { hint: 'detected' } : {}),
        ...(commandExists(pm, ctx.env) ? {} : { disabled: 'not found on PATH' }),
      })),
      initial: detected,
    }));

  const install =
    flags.dryRun || flags.install === false
      ? false
      : await ask.confirm({ message: 'Install packages?', initial: true });

  let git = flags.git ?? false;
  let gitNote: string | undefined;
  if (flags.git === undefined && !flags.dryRun) {
    if (!commandExists('git', ctx.env)) gitNote = 'no git (not on PATH)';
    else if (insideGitRepo(ctx.cwd)) gitNote = 'no git (inside a repo)';
    else
      git = await ask.confirm({
        message: 'Initialise git?',
        initial: true,
        note: ['a new repo with a first commit of the app'],
      });
  }

  recap(ui, [
    `${name} into ${shown}`,
    `${themeId(theme)} theme`,
    manager,
    install ? 'install' : 'no install',
    gitNote ?? (git ? 'git repo' : 'no git'),
  ]);

  const options: InitTemplateOptions = {
    ...(flags.registry === undefined ? {} : { registry: flags.registry }),
    dir: folder,
    theme: themeId(theme),
    manager,
    install,
    git,
    force: flags.force,
    dryRun: flags.dryRun,
    quiet: flags.quiet,
    verbose: flags.verbose,
    headerShown: true,
  };
  await runInitTemplate(ctx, name, options);
  await applyThemeUrl({ ...ctx, cwd: root }, theme, flags);
}

function cssProblem(cwd: string, value: string): string | undefined {
  const text = readText(join(cwd, value));
  if (text === undefined) return `${value} does not exist`;
  return importsTailwind(text)
    ? undefined
    : `${value} does not import Tailwind (@import "tailwindcss")`;
}

async function askAliases(ask: Prompter, cwd: string, framework: Framework) {
  const roots = readAliasRoots(cwd);
  const root = roots.find((r) => r.prefix === '@/') ?? roots[0];
  if (root === undefined)
    throw new CliError('found no import alias in tsconfig.json', aliasHint(framework));
  const aliases = defaultAliases(root.prefix);
  const keys = Object.keys(aliases) as (keyof RectioConfig['aliases'])[];
  const keep = await ask.confirm({
    message: 'Keep these aliases?',
    initial: true,
    note: keys.map((key) => `${key.padEnd(6)}  ${aliases[key]}`),
  });
  if (keep) return aliases;
  const edited = { ...aliases };
  for (const key of keys) {
    edited[key] = await ask.text({
      message: `Alias for ${key}`,
      initial: aliases[key],
      validate: (value) =>
        resolveAlias(roots, value) === undefined
          ? `start with a tsconfig path alias (${roots.map((r) => r.prefix).join(', ')})`
          : undefined,
    });
  }
  return edited;
}

async function existingFlow(
  ctx: CliContext,
  flags: InitFlags,
  ask: Prompter,
  ui: Ui,
  found: Detected,
) {
  const existing = readConfig(ctx.cwd);
  const keepConfig = existing !== undefined && !flags.force;
  const options: InitOptions = {
    ...(flags.registry === undefined ? {} : { registry: flags.registry }),
    ...(flags.pm === undefined ? {} : { manager: flags.pm }),
    install: flags.install !== false,
    force: flags.force,
    dryRun: flags.dryRun,
    quiet: flags.quiet,
    verbose: flags.verbose,
    headerShown: true,
  };
  const recapParts: string[] = [];
  let theme: ThemeSource = { kind: 'registry', id: flags.theme ?? existing?.theme ?? 'default' };

  if (keepConfig) {
    ui.line(ui.s.dim('rectio.json found: its framework, CSS entry, aliases and theme are kept.'));
    ui.line();
    recapParts.push('keep rectio.json');
  } else {
    const framework = await ask.select<Framework>({
      message: 'Framework',
      choices: FRAMEWORKS.map((f) => ({
        value: f,
        label: FRAMEWORK_LABELS[f],
        ...(f === found.framework ? { hint: 'detected' } : {}),
      })),
      ...(found.framework === undefined ? {} : { initial: found.framework }),
    });
    const css = await ask.text({
      message: 'CSS entry',
      ...(found.css === undefined ? {} : { initial: found.css }),
      validate: (value) => cssProblem(ctx.cwd, value),
    });
    const aliases = await askAliases(ask, ctx.cwd, framework);
    if (flags.theme === undefined) theme = await askTheme(ask);
    Object.assign(options, { framework, css, aliases });
    recapParts.push(FRAMEWORK_LABELS[framework], css, `${themeId(theme)} theme`);
  }
  options.theme = themeId(theme);

  const index = await createRegistryClient(registryUrl(ctx, flags.registry, existing)).index();
  const starters = STARTER_COMPONENTS.flatMap((name) => {
    const entry = index.items.find((e) => e.name === name);
    return entry === undefined
      ? []
      : [{ value: name, label: name, hint: shortDescription(entry.description) }];
  });
  const items = await ask.multiselect({
    message: 'Add components now?',
    choices: starters,
    note: [`Pick any or none. Add more later with ${cliCommand('add <item>')}.`],
  });
  options.items = items;
  recapParts.push(items.length === 0 ? 'no components' : items.join(' + '));

  recap(ui, recapParts);
  await runInit(ctx, options);
  await applyThemeUrl(ctx, theme, flags);
}

import { existsSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

import {
  PROJECT_PLACEHOLDER,
  TEMPLATE_ALIAS_DIRS,
  type IndexEntry,
  type RegistryItem,
} from '@rectio/registry';

import { registryUrl, writeConfig, type RectioConfig } from '../core/config.ts';
import { CliError, type CliContext } from '../core/context.ts';
import { isInside, toProjectPath, writeText } from '../core/fs.ts';
import { countDependencies } from '../core/install.ts';
import type { InstallOptions, InstallReport } from '../core/installer.ts';
import { importsTailwind } from '../core/project.ts';
import { createRegistryClient } from '../core/registry-client.ts';
import { initGitRepo, type GitResult } from '../core/system.ts';
import { projectContent } from '../core/transform.ts';
import { commandRows, plural, wrap } from '../ui/layout.ts';
import { Ui, type OutputOptions } from '../ui/output.ts';
import {
  devCommand,
  kindCounts,
  printVerbose,
  rowLines,
  tipParagraph,
  type Rows,
} from '../ui/report.ts';
import { CLI_VERSION } from '../version.ts';
import { installSteps, managerFor } from './install-steps.ts';
import { cliCommand } from '../core/runner.ts';

export interface InitTemplateOptions extends InstallOptions, OutputOptions {
  registry?: string;
  /** Folder of the new project, relative to the cwd. Default: the template name. */
  dir?: string;
  /** Write into a folder that is not empty. */
  force?: boolean;
  /** The data-theme the app starts on (every theme is installed). Default "default". */
  theme?: string;
  /** Create a git repo with a first commit after the install. */
  git?: boolean;
}

export interface TemplateFile {
  /** Path inside the new project, with forward slashes. */
  path: string;
  absolute: string;
  content: string;
}

export interface InitTemplateResult {
  root: string;
  config: RectioConfig;
  template: RegistryItem;
  files: TemplateFile[];
  report: InstallReport | undefined;
}

/** Templates import kit code through `@/`; the new project's tsconfig maps `@/*` to its root. */
const TEMPLATE_ALIASES = Object.fromEntries(
  Object.entries(TEMPLATE_ALIAS_DIRS).map(([key, dir]) => [key, `@/${dir}`]),
) as RectioConfig['aliases'];
const PROJECT_PREFIX = `@${PROJECT_PLACEHOLDER}/`;

/** A folder name as an npm package name: `My Books` -> `my-books`. */
export function packageNameFor(folder: string): string {
  const name = folder
    .toLowerCase()
    .replace(/[^a-z0-9._~-]+/g, '-')
    .replace(/^[-._]+|-+$/g, '');
  return name === '' ? 'rectio-app' : name;
}

function templateNames(entries: readonly IndexEntry[]): string {
  const names = entries.filter((e) => e.type === 'template').map((e) => e.name);
  return names.length === 0 ? 'none yet' : names.join(', ');
}

/** The template's files as they land in the new project, aliases rewritten. */
function templateFiles(root: string, template: RegistryItem, folder: string): TemplateFile[] {
  return template.files.map((file) => {
    if (!file.target.startsWith(PROJECT_PREFIX)) {
      throw new CliError(`${template.name}: ${file.target} is not a project file`);
    }
    const path = file.target.slice(PROJECT_PREFIX.length);
    const absolute = join(root, ...path.split('/'));
    if (!isInside(root, absolute)) {
      throw new CliError(`${template.name}: ${file.target} resolves outside the new project`);
    }
    let content = projectContent(file, TEMPLATE_ALIASES);
    if (path === 'package.json') {
      const pkg = JSON.parse(content) as Record<string, unknown>;
      content = `${JSON.stringify({ ...pkg, name: packageNameFor(folder) }, null, 2)}\n`;
    }
    return { path, absolute, content };
  });
}

/** Pages as one dim wrapped list, at most `max` of them, the rest counted. */
function pageLines(pages: readonly string[], ui: Ui, max = 12): string[] {
  const shown =
    pages.length > max ? [...pages.slice(0, max), `${String(pages.length - max)} more`] : pages;
  return wrap(shown, 56).map(
    (line, i) => `${ui.s.dim(i === 0 ? 'Pages' : '     ')}  ${ui.s.dim(line)}`,
  );
}

/**
 * `rectio init --template <name> [dir]`: a new project from a template. Resolves, fetches and
 * verifies the template and every kit item it uses first, then writes the template, `rectio.json`,
 * and installs the kit items through the same steps as `rectio add`, so the lockfile, the CSS entry
 * and package.json are kept the same.
 */
export async function runInitTemplate(
  ctx: CliContext,
  name: string,
  options: InitTemplateOptions = {},
): Promise<InitTemplateResult> {
  const ui = new Ui(ctx, options);
  const root = resolve(ctx.cwd, options.dir ?? name);
  const shown = toProjectPath(ctx.cwd, root) || '.';
  const project: CliContext = { ...ctx, cwd: root };
  const manager = options.manager ?? managerFor(project);
  const theme = options.theme ?? 'default';
  if (options.headerShown !== true) {
    ui.header('init', CLI_VERSION);
    ui.rows([
      ['template', name],
      ['folder', shown],
      ['theme', theme],
      ['package manager', manager],
    ]);
  }
  const dryRun = options.dryRun === true;
  const steps = ui.steps(options.git === true ? 6 : 5);

  const { client, entry } = await steps.run('Checking project', async (step) => {
    const registry = createRegistryClient(registryUrl(ctx, options.registry, undefined));
    const index = await registry.index();
    const found = index.items.find((item) => item.name === name);
    if (found?.type !== 'template') {
      throw new CliError(
        found === undefined
          ? `unknown template "${name}"`
          : `${name} is a ${found.type}, not a template`,
        `Templates: ${templateNames(index.items)}. See \`${cliCommand('list --templates')}\`.`,
      );
    }
    if (existsSync(root) && readdirSync(root).length > 0 && options.force !== true) {
      throw new CliError(
        `${shown} is not empty`,
        'Pick a new folder name, or pass --force to write the template into it.',
      );
    }
    step.note = existsSync(root) ? `${shown} (not empty, --force)` : `${shown} is free`;
    return { client: registry, entry: found };
  });

  // Everything is fetched and checked before the first write: a failed download or a broken item
  // leaves the disk untouched.
  const { template, files, config } = await steps.run('Fetching template', async (step) => {
    const item = await client.item(entry);
    const written = templateFiles(root, item, basename(root));
    const css = written.find((f) => f.path.endsWith('.css') && importsTailwind(f.content));
    if (css === undefined) throw new CliError(`${name} has no CSS file that imports Tailwind`);
    if (!item.registryDependencies.includes(`theme-${theme}`)) {
      const themes = item.registryDependencies.filter((d) => d.startsWith('theme-'));
      throw new CliError(
        `unknown theme "${theme}"`,
        `Available: ${themes.map((t) => t.slice(6)).join(', ')}.`,
      );
    }
    const made: RectioConfig = {
      schemaVersion: 1,
      registry: client.url,
      framework: item.template?.framework ?? 'next',
      css: css.path,
      theme,
      aliases: TEMPLATE_ALIASES,
    };
    step.note = `${item.name} ${item.version}, ${plural(written.length, 'file')}`;
    return { template: item, files: written, config: made };
  });

  const report = await installSteps(
    steps,
    project,
    config,
    client,
    template.registryDependencies,
    options,
    {
      planWhenWriting: true,
      itemsLabel: 'kit item',
      beforeWrite: () => {
        for (const file of files) writeText(file.absolute, file.content);
        writeConfig(root, config);
        return files.length + 1;
      },
    },
  );
  let git: GitResult | undefined;
  if (options.git === true) {
    if (dryRun) steps.skip('Creating git repo', 'dry run');
    else {
      git = await steps.run('Creating git repo', (step) => {
        const result = initGitRepo(root);
        step.note = result.committed ? 'first commit made' : 'no commit';
        if (result.reason !== undefined) step.warnings.push(result.reason);
        return result;
      });
    }
  }
  printVerbose(ui, report);

  const { s } = ui;
  const installed = report.manager !== undefined;
  const rows: Rows = [
    ['Template', `${template.title} ${s.dim(`${template.version}, ${config.framework}`)}`],
    ...wrap(kindCounts(report.items), 52).map((line, i): [string, string] => [
      i === 0 ? 'Kit' : '',
      line,
    ]),
    [
      'Files',
      `${String(files.length)} from the template, ${String(dryRun ? report.items.reduce((n, i) => n + i.files.length, 0) : report.files.length)} kit files`,
    ],
  ];
  const count = countDependencies(report.added);
  if (count > 0) {
    rows.push([
      'Packages',
      dryRun
        ? `${plural(count, 'package')} to install`
        : installed
          ? `${plural(count, 'package')} installed with ${manager}`
          : `${plural(count, 'package')} in package.json, not installed yet`,
    ]);
  }
  if (git !== undefined) {
    rows.push(['Git', git.committed ? 'new repo, first commit made' : 'new repo, no commit yet']);
  }
  const themes = template.registryDependencies
    .filter((d) => d.startsWith('theme-'))
    .map((d) => d.slice(6));
  const next: [string, string][] = [
    [`cd ${shown}`, 'go to the new project'],
    ...(installed || count === 0
      ? []
      : [[`${manager} install`, 'install the packages'] satisfies [string, string]]),
    [devCommand(manager), 'start the dev server'],
    [cliCommand('add <item>'), 'add a component or block'],
    [cliCommand('list'), 'browse every item'],
  ];
  const lines = [
    dryRun ? `Dry run: nothing was written (${shown} from ${template.title})` : `${shown} is ready`,
    '',
    ...rowLines(rows, s),
  ];
  if (!dryRun) {
    lines.push('', s.bold('Next'), ...commandRows(next, s));
  }
  const pages = template.template?.pages ?? [];
  if (pages.length > 0) lines.push('', ...pageLines(pages, ui));
  if (!dryRun && themes.length > 1) {
    lines.push(
      '',
      ...tipParagraph(`switch themes with data-theme on <html> (${themes.join(', ')})`, s),
    );
  }
  ui.summary(lines);
  return { root, config, template, files, report: dryRun ? undefined : report };
}

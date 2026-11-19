import { existsSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

import { PROJECT_PLACEHOLDER, type IndexEntry, type RegistryItem } from '@rectio/registry';

import { registryUrl, writeConfig, type RectioConfig } from '../core/config.ts';
import { CliError, type CliContext } from '../core/context.ts';
import { isInside, toProjectPath, writeText } from '../core/fs.ts';
import {
  installItems,
  requireKeyFor,
  resolveItems,
  type InstallOptions,
  type InstallReport,
} from '../core/installer.ts';
import { importsTailwind } from '../core/project.ts';
import { createRegistryClient } from '../core/registry-client.ts';
import { projectContent } from '../core/transform.ts';
import { printReport } from './add.ts';

export interface InitTemplateOptions extends InstallOptions {
  registry?: string;
  /** Folder of the new project, relative to the cwd. Default: the template name. */
  dir?: string;
  /** Write into a folder that is not empty. */
  force?: boolean;
  /** The data-theme the app starts on (every theme is installed). Default "default". */
  theme?: string;
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
const TEMPLATE_ALIASES: RectioConfig['aliases'] = {
  ui: '@/components/ui',
  blocks: '@/components/blocks',
  lib: '@/lib',
  hooks: '@/hooks',
  styles: '@/styles/rectio',
};
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

/**
 * `rectio init --template <name> [dir]`: a new project from a template. Resolves, fetches and
 * verifies the template and every kit item it uses first (a pro template needs the license key
 * like any pro item), then writes the template, `rectio.json`, and installs the kit items through
 * the same path as `rectio add`, so the lockfile, the CSS entry and package.json are kept the same.
 */
export async function runInitTemplate(
  ctx: CliContext,
  name: string,
  options: InitTemplateOptions = {},
): Promise<InitTemplateResult> {
  const client = createRegistryClient(registryUrl(ctx, options.registry, undefined));
  const index = await client.index();
  const entry = index.items.find((item) => item.name === name);
  if (entry?.type !== 'template') {
    throw new CliError(
      entry === undefined
        ? `unknown template "${name}"`
        : `${name} is a ${entry.type}, not a template`,
      `Templates: ${templateNames(index.items)}. See \`rectio list --templates\`.`,
    );
  }

  const root = resolve(ctx.cwd, options.dir ?? name);
  const shown = toProjectPath(ctx.cwd, root) || '.';
  if (existsSync(root) && readdirSync(root).length > 0 && options.force !== true) {
    throw new CliError(
      `${shown} is not empty`,
      'Pick a new folder name, or pass --force to write the template into it.',
    );
  }

  // Everything is fetched and checked before the first write: a missing key, a failed download or
  // a broken item leaves the disk untouched.
  const entries = await resolveItems(client, [name]);
  const key = requireKeyFor(ctx, entries);
  const items = await Promise.all(entries.map((e) => client.item(e, key)));
  const template = items.find((item) => item.name === name);
  if (template === undefined) throw new CliError(`${name} was not fetched`);

  const files = templateFiles(root, template, basename(root));
  const css = files.find((f) => f.path.endsWith('.css') && importsTailwind(f.content));
  if (css === undefined) throw new CliError(`${name} has no CSS file that imports Tailwind`);
  const theme = options.theme ?? 'default';
  if (!template.registryDependencies.includes(`theme-${theme}`)) {
    const themes = template.registryDependencies.filter((d) => d.startsWith('theme-'));
    throw new CliError(
      `unknown theme "${theme}"`,
      `Available: ${themes.map((t) => t.slice(6)).join(', ')}.`,
    );
  }
  const config: RectioConfig = {
    schemaVersion: 1,
    registry: client.url,
    framework: template.template?.framework ?? 'next',
    css: css.path,
    theme,
    aliases: TEMPLATE_ALIASES,
  };

  const kit = items.filter((item) => item.name !== name);
  if (options.dryRun === true) {
    ctx.log(`Would create ${shown} from ${template.title} (${template.name}@${template.version}):`);
    ctx.log(`  ${String(files.length)} template files`);
    ctx.log(`  kit items: ${kit.map((i) => i.name).join(', ')}`);
    return { root, config, template, files, report: undefined };
  }

  for (const file of files) writeText(file.absolute, file.content);
  writeConfig(root, config);
  const report = await installItems(
    { ...ctx, cwd: root },
    config,
    client,
    template.registryDependencies,
    options,
  );

  ctx.log(`Created ${shown} from ${template.title} (${String(files.length)} files).`);
  printReport(ctx, report);
  const pages = template.template?.pages.join(', ');
  ctx.log(
    [
      '',
      'Next:',
      `  cd ${shown}`,
      ...(options.install === false ? ['  install the packages with your package manager'] : []),
      '  run the dev script (for example `pnpm dev`)',
      ...(pages === undefined ? [] : [`Pages: ${pages}`]),
    ].join('\n'),
  );
  return { root, config, template, files, report };
}

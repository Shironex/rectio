import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { Framework } from './config.ts';
import { CliError } from './context.ts';
import { parseJsonc, readJson, readText, toProjectPath } from './fs.ts';

export interface PackageJson {
  name?: string;
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export function readPackageJson(cwd: string): PackageJson {
  const pkg = readJson(join(cwd, 'package.json')) as PackageJson | undefined;
  if (pkg === undefined) {
    throw new CliError(`no package.json in ${cwd}`, 'Run rectio from the root of a React app.');
  }
  return pkg;
}

const allDeps = (pkg: PackageJson) => ({ ...pkg.devDependencies, ...pkg.dependencies });

const hasConfig = (cwd: string, base: string) =>
  ['js', 'mjs', 'cjs', 'ts', 'mts'].some((ext) => existsSync(join(cwd, `${base}.${ext}`)));

/** TanStack Start runs on Vite, so it is checked before plain Vite. */
export function detectFramework(cwd: string, pkg: PackageJson): Framework | undefined {
  const deps = allDeps(pkg);
  if ('@tanstack/react-start' in deps || '@tanstack/start' in deps) return 'tanstack-start';
  if ('next' in deps || hasConfig(cwd, 'next.config')) return 'next';
  if ('vite' in deps || hasConfig(cwd, 'vite.config')) return 'vite';
  return undefined;
}

/** First number of a range or version: `^4.3.5` -> 4, `>=19` -> 19. */
export function majorOf(range: string | undefined): number | undefined {
  const match = range === undefined ? null : /(\d+)/.exec(range);
  return match?.[1] === undefined ? undefined : Number(match[1]);
}

/** The installed version of a package, looking up through parent node_modules folders. */
export function installedVersion(cwd: string, name: string): string | undefined {
  let dir = resolve(cwd);
  for (;;) {
    const pkg = readJson(join(dir, 'node_modules', name, 'package.json')) as
      { version?: string } | undefined;
    if (pkg?.version !== undefined) return pkg.version;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

export interface TailwindCheck {
  version: string;
  warnings: string[];
}

/** Tailwind v4 is required: v3 configs and `@tailwind` directives cannot carry the tokens. */
export function checkTailwind(cwd: string, pkg: PackageJson, framework: Framework): TailwindCheck {
  const deps = allDeps(pkg);
  const version = installedVersion(cwd, 'tailwindcss') ?? deps.tailwindcss;
  if (version === undefined) {
    throw new CliError(
      'Tailwind CSS is not installed',
      framework === 'next'
        ? 'Install Tailwind v4: `tailwindcss @tailwindcss/postcss`, then run init again.'
        : 'Install Tailwind v4: `tailwindcss @tailwindcss/vite`, then run init again.',
    );
  }
  const major = majorOf(version);
  if (major === undefined || major < 4) {
    throw new CliError(
      `rectio needs Tailwind CSS v4, found ${version}`,
      'Upgrade with the official tool (`npx @tailwindcss/upgrade`), then run init again.',
    );
  }
  const warnings: string[] = [];
  const plugin = framework === 'next' ? '@tailwindcss/postcss' : '@tailwindcss/vite';
  if (!(plugin in deps) && !('@tailwindcss/postcss' in deps) && !('@tailwindcss/vite' in deps)) {
    warnings.push(`no Tailwind integration found: add ${plugin} to your build`);
  }
  return { version, warnings };
}

const TAILWIND_IMPORT = /^\s*@import\s+['"]tailwindcss['"][^;]*;/m;
const CSS_CANDIDATES = [
  'src/index.css',
  'src/styles.css',
  'src/app.css',
  'src/globals.css',
  'src/styles/globals.css',
  'src/app/globals.css',
  'app/globals.css',
  'app/styles.css',
  'app/app.css',
  'styles/globals.css',
];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '.output', '.git', 'public']);

export function importsTailwind(css: string): boolean {
  return TAILWIND_IMPORT.test(css);
}

/** The CSS file with `@import "tailwindcss"`, project relative. */
export function findCssEntry(cwd: string): string | undefined {
  for (const candidate of CSS_CANDIDATES) {
    const text = readText(join(cwd, candidate));
    if (text !== undefined && importsTailwind(text)) return candidate;
  }
  const search = (dir: string, depth: number): string | undefined => {
    if (depth > 4 || !existsSync(dir)) return undefined;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const hit = search(path, depth + 1);
        if (hit !== undefined) return hit;
      } else if (entry.name.endsWith('.css') && importsTailwind(readText(path) ?? '')) {
        return toProjectPath(cwd, path);
      }
    }
    return undefined;
  };
  return search(join(cwd, 'src'), 0) ?? search(join(cwd, 'app'), 0);
}

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

const LOCKFILES: [string, PackageManager][] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
];

const MANAGERS: readonly PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];
const asManager = (name: string | undefined): PackageManager | undefined =>
  MANAGERS.find((manager) => manager === name);

/**
 * The manager that launched the CLI, from npm_config_user_agent: `pnpm dlx` and `pnpm exec` set
 * `pnpm/10.x ...`, npx sets `npm/11.x ...`, bunx `bun/1.x ...` and `yarn dlx` `yarn/4.x ...`.
 */
export function managerFromUserAgent(userAgent: string | undefined): PackageManager | undefined {
  return asManager(userAgent?.trim().split('/')[0]?.toLowerCase());
}

/**
 * From the nearest lockfile (walking up for workspaces), then `packageManager`, then the manager
 * that launched the CLI, then npm. The project always wins over how the CLI was started.
 */
export function detectPackageManager(
  cwd: string,
  env: Readonly<Record<string, string | undefined>> = {},
): PackageManager {
  let dir = resolve(cwd);
  for (;;) {
    for (const [file, manager] of LOCKFILES) if (existsSync(join(dir, file))) return manager;
    const field = (readJson(join(dir, 'package.json')) as PackageJson | undefined)?.packageManager;
    const named = asManager(field?.split('@')[0]);
    if (named !== undefined) return named;
    const parent = dirname(dir);
    if (parent === dir) return managerFromUserAgent(env.npm_config_user_agent) ?? 'npm';
    dir = parent;
  }
}

/** One `paths` entry: `@/*` -> `<abs>/src/`. */
export interface AliasRoot {
  prefix: string;
  dir: string;
}

interface TsConfig {
  extends?: string | string[];
  references?: { path: string }[];
  compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> };
}

function tsconfigFile(path: string): string {
  return path.endsWith('.json') ? path : join(path, 'tsconfig.json');
}

/**
 * Wildcard path aliases from tsconfig.json, its references (Vite's tsconfig.app.json) and its
 * relative `extends`. Paths resolve against baseUrl, or the declaring file when there is none.
 */
export function readAliasRoots(cwd: string): AliasRoot[] {
  const roots: AliasRoot[] = [];
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file) || !existsSync(file)) return;
    seen.add(file);
    const config = parseJsonc(readText(file) ?? '{}') as TsConfig;
    const dir = dirname(file);
    const base = config.compilerOptions?.baseUrl;
    const from = base === undefined ? dir : resolve(dir, base);
    for (const [key, targets] of Object.entries(config.compilerOptions?.paths ?? {})) {
      const target = targets[0];
      if (!key.endsWith('/*') || target?.endsWith('/*') !== true) continue;
      if (roots.some((r) => r.prefix === key.slice(0, -1))) continue;
      roots.push({ prefix: key.slice(0, -1), dir: resolve(from, target.slice(0, -1)) });
    }
    const parents = typeof config.extends === 'string' ? [config.extends] : (config.extends ?? []);
    for (const parent of parents) if (parent.startsWith('.')) visit(resolve(dir, parent));
    for (const ref of config.references ?? []) visit(tsconfigFile(resolve(dir, ref.path)));
  };
  visit(join(cwd, 'tsconfig.json'));
  visit(join(cwd, 'jsconfig.json'));
  return roots;
}

/** `@/components/ui` -> absolute folder, through the alias roots. */
export function resolveAlias(roots: readonly AliasRoot[], specifier: string): string | undefined {
  const root = [...roots]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((r) => specifier.startsWith(r.prefix));
  return root === undefined ? undefined : join(root.dir, specifier.slice(root.prefix.length));
}

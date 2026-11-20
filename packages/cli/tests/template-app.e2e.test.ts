/**
 * End to end: `rectio init --template <name>` for every template in the locally built registry,
 * into a temp folder outside the repo, then the new project's own install, typecheck and static
 * build. Runs the built CLI (dist/bin.js) as a child process, the way a buyer runs it, and installs
 * real packages with pnpm (the store makes repeat runs fast). Paths are built with node:path and
 * the package manager is spawned through a shell on Windows, so it runs there too.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { RegistryIndex } from '@rectio/registry';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { read, tempDir } from './helpers.ts';

const here = dirname(fileURLToPath(import.meta.url));
const cliBin = join(here, '..', 'dist', 'bin.js');
const registryDir = join(here, '..', '..', 'registry', 'dist', 'registry');
const TIMEOUT = 600_000;

/** The outer pnpm run leaks npm_* settings (workspace dir, user agent) that must not reach the app. */
function cleanEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([key]) => !/^npm_/i.test(key) && key !== 'INIT_CWD'),
    ),
    ...extra,
  };
}

function run(cwd: string, command: string, args: string[], env: Record<string, string> = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: cleanEnv(env),
    encoding: 'utf8',
    // Package managers are .cmd shims on Windows; the arguments here are fixed strings.
    shell: process.platform === 'win32' && command !== process.execPath,
    timeout: TIMEOUT,
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

function ok(cwd: string, command: string, args: string[], env: Record<string, string> = {}) {
  const result = run(cwd, command, args, env);
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed (${String(result.status)}):\n${result.output}`,
    );
  }
  return result.output;
}

/** Every file of the new project outside node_modules and build output, posix relative. */
function projectFiles(root: string, dir = root): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return ['node_modules', '.next', 'out'].includes(entry.name) ? [] : projectFiles(root, path);
    }
    return [relative(root, path).split(sep).join('/')];
  });
}

const index = existsSync(join(registryDir, 'index.json'))
  ? (JSON.parse(readFileSync(join(registryDir, 'index.json'), 'utf8')) as RegistryIndex)
  : undefined;
const templates = index?.items.filter((item) => item.type === 'template') ?? [];

describe('a project from each template', () => {
  let parent: ReturnType<typeof tempDir>;
  beforeAll(() => {
    if (!existsSync(cliBin) || index === undefined) {
      throw new Error('build first: pnpm --filter @rectio/registry --filter @rectio/cli build');
    }
    parent = tempDir('rectio-e2e-template-');
  });

  afterAll(() => {
    parent.cleanup();
  }, 120_000);

  it('has at least the finance app', () => {
    expect(templates.map((t) => t.name)).toContain('finance-app');
  });

  for (const template of templates) {
    it(
      `${template.name}: creates a project with no key that installs, typechecks and builds`,
      () => {
        const registry = pathToFileURL(registryDir).href;
        const folder = `${template.name} app`;
        const root = join(parent.dir, folder);
        const args = [cliBin, 'init', '--template', template.name, folder, '--registry', registry];

        const created = ok(parent.dir, process.execPath, [...args, '--no-install']);
        expect(created).toContain(`${folder} is ready`);

        const files = projectFiles(root);
        expect(files).toContain('rectio.json');
        expect(files).toContain('rectio.lock.json');
        expect(files.some((f) => f.startsWith('components/ui/'))).toBe(true);
        for (const file of files.filter((f) => /\.(tsx?|css|json|mjs)$/.test(f))) {
          const text = read(root, file);
          // Prose may name the kit's packages; no import, CSS import or dependency may.
          expect(text, file).not.toMatch(
            /(?:from|import|@import)\s*\(?\s*['"]@(?:rectio|registry)\//,
          );
          expect(text, file).not.toMatch(/"@rectio\/[\w-]+"\s*:/);
          expect(text, file).not.toContain('workspace:');
        }
        const pkg = JSON.parse(read(root, 'package.json')) as { name: string };
        expect(pkg.name).toBe(`${template.name}-app`);

        ok(root, 'pnpm', ['install', '--prefer-offline']);
        ok(root, 'pnpm', ['run', 'typecheck']);
        ok(root, 'pnpm', ['run', 'build']);
        expect(existsSync(join(root, 'out', 'index.html'))).toBe(true);
        const html = read(root, 'out/index.html');
        expect(html).toContain('data-theme');
        // Token utilities compiled and theme variables present: the tokens reached Tailwind.
        const assets = join(root, 'out', '_next');
        const css = readdirSync(assets, { recursive: true, encoding: 'utf8' })
          .filter((f) => f.endsWith('.css'))
          .map((f) => readFileSync(join(assets, f), 'utf8'))
          .join('\n');
        expect(css).toContain('--rx-accent');
        // The one default theme, light and dark; the retired ledger theme is not installed.
        expect(css).toMatch(/data-mode=["']?dark/);
        expect(css).not.toMatch(/data-theme=["']?ledger/);
      },
      TIMEOUT,
    );
  }
});

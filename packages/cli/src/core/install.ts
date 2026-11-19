import { spawn } from 'node:child_process';
import { join } from 'node:path';

import { CliError } from './context.ts';
import { readText, writeText } from './fs.ts';
import type { PackageJson, PackageManager } from './project.ts';

export interface DependencyChanges {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

/** Packages the project does not declare yet; a range the project already has always wins. */
export function missingDependencies(cwd: string, wanted: DependencyChanges): DependencyChanges {
  const pkg = JSON.parse(readText(join(cwd, 'package.json')) ?? '{}') as PackageJson;
  const present = { ...pkg.dependencies, ...pkg.devDependencies };
  const missing: DependencyChanges = { dependencies: {}, devDependencies: {} };
  for (const field of ['dependencies', 'devDependencies'] as const) {
    for (const [name, range] of Object.entries(wanted[field])) {
      if (name in present || name in missing.dependencies) continue;
      missing[field][name] = range;
    }
  }
  return missing;
}

export const countDependencies = (changes: DependencyChanges): number =>
  Object.keys(changes.dependencies).length + Object.keys(changes.devDependencies).length;

/** Adds the missing packages to package.json, sorted, keeping the file's indentation. */
export function mergeDependencies(cwd: string, wanted: DependencyChanges): DependencyChanges {
  const added = missingDependencies(cwd, wanted);
  if (countDependencies(added) === 0) return added;
  const file = join(cwd, 'package.json');
  const text = readText(file) ?? '{}';
  const pkg = JSON.parse(text) as PackageJson & Record<string, unknown>;
  for (const field of ['dependencies', 'devDependencies'] as const) {
    if (Object.keys(added[field]).length === 0) continue;
    const merged = { ...pkg[field], ...added[field] };
    pkg[field] = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => (a < b ? -1 : 1)));
  }
  const indent = /^[ \t]+(?=")/m.exec(text)?.[0] ?? '  ';
  writeText(file, `${JSON.stringify(pkg, null, indent)}\n`);
  return added;
}

/**
 * Runs `<manager> install` in the project. The arguments are fixed strings: on Windows the
 * managers are .cmd shims, which Node only spawns through a shell.
 */
export function runInstall(cwd: string, manager: PackageManager): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(manager, ['install'], {
      cwd,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.on('error', (error) => {
      reject(
        new CliError(
          `could not run ${manager}: ${error.message}`,
          `Run \`${manager} install\` yourself.`,
        ),
      );
    });
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else {
        reject(
          new CliError(
            `${manager} install failed (exit ${String(code)}):\n${output.trim().split('\n').slice(-15).join('\n')}`,
            `The files are written; fix the error and run \`${manager} install\`.`,
          ),
        );
      }
    });
  });
}

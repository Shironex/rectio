import { spawnSync } from 'node:child_process';
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';

type Env = Readonly<Record<string, string | undefined>>;

/** Whether a command is on PATH, without running it. On Windows PATHEXT names the shims. */
export function commandExists(
  name: string,
  env: Env,
  platform: NodeJS.Platform = process.platform,
): boolean {
  const path = env.PATH ?? env.Path ?? '';
  const extensions =
    platform === 'win32' ? (env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';') : [''];
  return path
    .split(platform === 'win32' ? ';' : delimiter)
    .filter((dir) => dir !== '')
    .some((dir) =>
      extensions.some((ext) => {
        const file = join(dir, `${name}${ext.toLowerCase()}`);
        try {
          return statSync(file).isFile();
        } catch {
          return false;
        }
      }),
    );
}

/** A `.git` in the folder or any parent: a new app there should not get a repo of its own. */
export function insideGitRepo(dir: string): boolean {
  let current = resolve(dir);
  for (;;) {
    if (existsSync(join(current, '.git'))) return true;
    const parent = dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}

export interface GitResult {
  committed: boolean;
  /** Why there is no first commit, when there is none. */
  reason?: string;
}

/** What a new app keeps out of git when its template ships no .gitignore of its own. */
export const DEFAULT_GITIGNORE = [
  'node_modules',
  '.next',
  'out',
  'build',
  'dist',
  '.turbo',
  '*.tsbuildinfo',
  'next-env.d.ts',
  '.env*.local',
  '.DS_Store',
  '',
].join('\n');

const git = (cwd: string, args: string[]) =>
  spawnSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/**
 * `git init`, then one commit of everything but what .gitignore leaves out (a default one is
 * written when the template has none). A missing identity (user.name, user.email) leaves the
 * repo without a commit instead of failing the run: the app is already written and installed.
 */
export function initGitRepo(root: string, message = 'Initial commit from rectio'): GitResult {
  // Without one, the first commit would carry node_modules.
  const ignore = join(root, '.gitignore');
  if (!existsSync(ignore)) writeFileSync(ignore, DEFAULT_GITIGNORE);
  const init = git(root, ['init', '--quiet']);
  if (init.status !== 0) return { committed: false, reason: 'git init failed' };
  const add = git(root, ['add', '--all']);
  if (add.status !== 0) return { committed: false, reason: 'git add failed' };
  const commit = git(root, ['commit', '--quiet', '--no-verify', '--message', message]);
  if (commit.status !== 0) {
    const identity = /user\.(name|email)|identity/i.test(commit.stderr);
    return {
      committed: false,
      reason: identity ? 'set git user.name and user.email to commit' : 'git commit failed',
    };
  }
  return { committed: true };
}

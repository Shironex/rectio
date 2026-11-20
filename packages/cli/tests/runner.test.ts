import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { outdatedHint } from '../src/core/outdated.ts';
import { cliCommand, detectRunner, setRunner, type Runner } from '../src/core/runner.ts';
import { main } from '../src/main.ts';
import { VITE_APP, buildTestRegistry, capture, tempDir, writeTree } from './helpers.ts';

const PNPM = { npm_config_user_agent: 'pnpm/10.34.5 npm/? node/v22.23.4 darwin arm64' };
const YARN = { npm_config_user_agent: 'yarn/4.9.1 npm/? node/v22.23.4 linux x64' };
const BUN = { npm_config_user_agent: 'bun/1.3.2 npm/? node/v24.3.0 darwin arm64' };

afterEach(() => {
  setRunner('installed');
});

describe('detectRunner', () => {
  it.each([
    [
      '/Users/me/Library/Caches/pnpm/dlx/xyz/1/node_modules/@rectio/cli/dist/bin.js',
      PNPM,
      'pnpm-dlx',
    ],
    [
      'C:\\Users\\me\\AppData\\Local\\pnpm-cache\\dlx\\xyz\\1\\node_modules\\@rectio\\cli\\dist\\bin.js',
      PNPM,
      'pnpm-dlx',
    ],
    ['/Users/me/.npm/_npx/ab12/node_modules/@rectio/cli/dist/bin.js', {}, 'npx'],
    [
      'C:\\Users\\me\\AppData\\Local\\npm-cache\\_npx\\ab12\\node_modules\\@rectio\\cli\\dist\\bin.js',
      {},
      'npx',
    ],
    ['/private/tmp/bunx-501-@rectio/cli@latest/node_modules/@rectio/cli/dist/bin.js', BUN, 'bunx'],
    ['/tmp/xfs-1a2b3c/dlx-4242/node_modules/@rectio/cli/dist/bin.js', YARN, 'yarn-dlx'],
    ['/usr/local/lib/node_modules/@rectio/cli/dist/bin.js', {}, 'installed'],
    ['/home/me/.local/share/pnpm/global/5/node_modules/@rectio/cli/dist/bin.js', PNPM, 'installed'],
    ['/work/app/node_modules/@rectio/cli/dist/bin.js', PNPM, 'installed'],
    // A dlx-looking folder without yarn's user agent is not a yarn dlx run.
    ['/work/dlx-tools/node_modules/@rectio/cli/dist/bin.js', {}, 'installed'],
  ] as const)('%s -> %s', (path, env, runner) => {
    expect(detectRunner(path, env)).toBe(runner);
  });
});

describe('cliCommand', () => {
  it.each([
    ['pnpm-dlx', 'pnpm dlx @rectio/cli add <item>'],
    ['npx', 'npx @rectio/cli add <item>'],
    ['bunx', 'bunx @rectio/cli add <item>'],
    ['yarn-dlx', 'yarn dlx @rectio/cli add <item>'],
    ['installed', 'rectio add <item>'],
  ] as [Runner, string][])('%s', (runner, expected) => {
    setRunner(runner);
    expect(cliCommand('add <item>')).toBe(expected);
    // Never @latest: only the update notice asks for it.
    expect(cliCommand('list')).not.toContain('@latest');
  });

  it('carries into the outdated hint', () => {
    setRunner('npx');
    expect(outdatedHint([{ name: 'button', installed: '1.0.0', latest: '1.1.0' }])).toBe(
      '1 installed item has a newer version: run `npx @rectio/cli update` to list them',
    );
  });
});

describe('printed commands in a real run', () => {
  let registry: ReturnType<typeof buildTestRegistry>;
  const cleanups: (() => void)[] = [];
  beforeAll(() => {
    registry = buildTestRegistry();
  });
  afterAll(() => {
    registry.cleanup();
    for (const cleanup of cleanups) cleanup();
  });

  function project(files: Record<string, string> = VITE_APP): string {
    const temp = tempDir('rectio-runner-');
    cleanups.push(temp.cleanup);
    writeTree(temp.dir, files);
    return temp.dir;
  }

  it('fills the Next block with the pnpm dlx form', async () => {
    const run = capture(project(), { RECTIO_NO_UPDATE_CHECK: '1' });
    run.ctx.runner = 'pnpm-dlx';
    expect(await main(['init', '--no-install', '--registry', registry.dir], run.ctx)).toBe(0);
    const out = run.out.join('\n');
    expect(out).toContain('pnpm dlx @rectio/cli add button');
    expect(out).toContain('pnpm dlx @rectio/cli list');
    expect(out).not.toMatch(/^\s+rectio add/m);
  });

  it('uses the same form in error hints', async () => {
    const run = capture(project({ 'package.json': '{}' }), { RECTIO_NO_UPDATE_CHECK: '1' });
    run.ctx.runner = 'npx';
    expect(await main(['add', 'button', '--registry', registry.dir], run.ctx)).toBe(1);
    expect(run.err.join('\n')).toContain('Run `npx @rectio/cli init` first.');

    const usage = capture(project(), { RECTIO_NO_UPDATE_CHECK: '1' });
    usage.ctx.runner = 'bunx';
    expect(await main(['nope'], usage.ctx)).toBe(1);
    expect(usage.err.join('\n')).toContain('Run `bunx @rectio/cli --help` for usage.');
  });

  it('prints plain rectio for an installed CLI', async () => {
    const run = capture(project(), { RECTIO_NO_UPDATE_CHECK: '1' });
    run.ctx.runner = 'installed';
    expect(await main(['init', '--no-install', '--registry', registry.dir], run.ctx)).toBe(0);
    expect(run.out.join('\n')).toContain('rectio add button');
    expect(run.out.join('\n')).not.toContain('@rectio/cli');
  });
});

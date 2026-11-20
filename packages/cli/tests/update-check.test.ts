import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CACHE_FILE,
  CHECK_INTERVAL_MS,
  LATEST_URL,
  cacheDir,
  checkForUpdate,
  isNewer,
  startUpdateCheck,
  updateCheckEnabled,
  updateCommand,
  type UpdateCheckOptions,
} from '../src/core/update-check.ts';
import { main } from '../src/main.ts';
import { VITE_APP, capture, tempDir, writeTree } from './helpers.ts';

const NOW = Date.UTC(2026, 10, 20, 12);

let cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups) cleanup();
  cleanups = [];
  vi.useRealTimers();
});

function cache(): string {
  const temp = tempDir('rectio-update-check-');
  cleanups.push(temp.cleanup);
  return temp.dir;
}

function seed(dir: string, record: { checkedAt: number; latest?: string }) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, CACHE_FILE), JSON.stringify(record));
}

function answering(version: string) {
  return vi.fn<typeof fetch>(() =>
    Promise.resolve(Response.json({ name: '@rectio/cli', version })),
  );
}

function options(overrides: Partial<UpdateCheckOptions>): UpdateCheckOptions {
  return {
    current: '0.1.0',
    command: 'add',
    env: {},
    isTTY: true,
    now: () => NOW,
    scriptPath: '/home/me/.local/share/pnpm/global/5/node_modules/@rectio/cli/dist/bin.js',
    ...overrides,
  };
}

describe('checkForUpdate', () => {
  it('returns the newer version from npm and caches it', async () => {
    const dir = cache();
    const fetchFn = answering('0.2.0');
    expect(await checkForUpdate(options({ fetch: fetchFn, cacheDir: dir }))).toBe('0.2.0');
    expect(fetchFn).toHaveBeenCalledWith(LATEST_URL, expect.anything());
    expect(JSON.parse(readFileSync(join(dir, CACHE_FILE), 'utf8'))).toEqual({
      checkedAt: NOW,
      latest: '0.2.0',
    });
  });

  it('returns nothing when npm has the same version', async () => {
    const fetchFn = answering('0.1.0');
    expect(await checkForUpdate(options({ fetch: fetchFn, cacheDir: cache() }))).toBeUndefined();
  });

  it('swallows a network error and records the attempt', async () => {
    const dir = cache();
    const fetchFn = vi.fn<typeof fetch>(() => Promise.reject(new TypeError('fetch failed')));
    expect(await checkForUpdate(options({ fetch: fetchFn, cacheDir: dir }))).toBeUndefined();
    expect(JSON.parse(readFileSync(join(dir, CACHE_FILE), 'utf8'))).toEqual({ checkedAt: NOW });
  });

  it('uses the cache inside 24 hours and asks again after', async () => {
    const dir = cache();
    seed(dir, { checkedAt: NOW - CHECK_INTERVAL_MS + 60_000, latest: '0.3.0' });
    const fetchFn = answering('0.4.0');
    expect(await checkForUpdate(options({ fetch: fetchFn, cacheDir: dir }))).toBe('0.3.0');
    expect(fetchFn).not.toHaveBeenCalled();

    const later = NOW + 60_000;
    expect(await checkForUpdate(options({ fetch: fetchFn, cacheDir: dir, now: () => later }))).toBe(
      '0.4.0',
    );
    expect(fetchFn).toHaveBeenCalledOnce();
  });
});

describe('startUpdateCheck', () => {
  it('builds the notice with the update command', async () => {
    const notice = await startUpdateCheck(
      options({ fetch: answering('0.2.0'), cacheDir: cache() }),
    );
    expect(notice).toBe(
      '\nrectio 0.2.0 is available (you have 0.1.0).\nUse it with: pnpm add -g @rectio/cli@latest',
    );
  });

  it('gives up at the timeout instead of waiting for a slow registry', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn<typeof fetch>(() => new Promise<Response>(() => undefined));
    let settled: string | undefined = 'pending';
    const notice = startUpdateCheck(
      options({ fetch: fetchFn, cacheDir: cache(), timeoutMs: 1500 }),
    );
    void notice.then((value) => (settled = value));
    await vi.advanceTimersByTimeAsync(1499);
    expect(settled).toBe('pending');
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBeUndefined();
  });

  it.each([
    ['CI', { env: { CI: 'true' } }],
    ['a pipe', { isTTY: false }],
    ['the MCP server', { command: 'mcp' }],
    ['RECTIO_NO_UPDATE_CHECK=1', { env: { RECTIO_NO_UPDATE_CHECK: '1' } }],
    ['--help and --version', { command: undefined }],
  ] as const)('is skipped under %s', async (_name, overrides) => {
    const fetchFn = answering('9.9.9');
    const dir = cache();
    seed(dir, { checkedAt: NOW, latest: '9.9.9' });
    const opts = options({ fetch: fetchFn, cacheDir: dir, ...overrides });
    expect(updateCheckEnabled(opts)).toBe(false);
    expect(await startUpdateCheck(opts)).toBeUndefined();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('keeps CI=false and an empty opt-out as enabled', () => {
    expect(
      updateCheckEnabled({
        command: 'add',
        isTTY: true,
        env: { CI: 'false', RECTIO_NO_UPDATE_CHECK: '' },
      }),
    ).toBe(true);
  });
});

describe('helpers', () => {
  it('compares stable versions only', () => {
    expect(isNewer('0.2.0', '0.1.9')).toBe(true);
    expect(isNewer('1.0.0', '0.10.0')).toBe(true);
    expect(isNewer('0.1.0', '0.1.0')).toBe(false);
    expect(isNewer('0.0.9', '0.1.0')).toBe(false);
    expect(isNewer('0.2.0-beta.1', '0.1.0')).toBe(false);
    expect(isNewer('garbage', '0.1.0')).toBe(false);
  });

  it('suggests the update that matches how the CLI was run', () => {
    expect(
      updateCommand('/Users/me/.npm/_npx/ab12/node_modules/@rectio/cli/dist/bin.js', 'add'),
    ).toBe('npx @rectio/cli@latest add');
    expect(
      updateCommand(
        '/Users/me/Library/Caches/pnpm/dlx/xyz/1/node_modules/@rectio/cli/dist/bin.js',
        'list',
      ),
    ).toBe('pnpm dlx @rectio/cli@latest list');
    expect(
      updateCommand(
        'C:\\Users\\me\\AppData\\Local\\pnpm\\global\\5\\node_modules\\@rectio\\cli\\dist\\bin.js',
        'add',
      ),
    ).toBe('pnpm add -g @rectio/cli@latest');
    expect(updateCommand('/usr/local/lib/node_modules/@rectio/cli/dist/bin.js', 'add')).toBe(
      'npm install -g @rectio/cli@latest',
    );
    expect(
      updateCommand(
        'C:\\Users\\me\\AppData\\Roaming\\npm\\node_modules\\@rectio\\cli\\dist\\bin.js',
        'add',
      ),
    ).toBe('npm install -g @rectio/cli@latest');
    expect(updateCommand('/work/app/node_modules/@rectio/cli/dist/bin.js', 'add')).toBe(
      'pnpm dlx @rectio/cli@latest add',
    );
  });

  it('puts the cache in the per-user cache folder of each platform', () => {
    expect(cacheDir({}, 'darwin', '/Users/me')).toBe(
      join('/Users/me', 'Library', 'Caches', 'rectio'),
    );
    expect(cacheDir({}, 'linux', '/home/me')).toBe(join('/home/me', '.cache', 'rectio'));
    expect(cacheDir({ XDG_CACHE_HOME: '/tmp/xdg' }, 'linux', '/home/me')).toBe(
      join('/tmp/xdg', 'rectio'),
    );
    expect(
      cacheDir({ LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local' }, 'win32', 'C:\\Users\\me'),
    ).toBe(join('C:\\Users\\me\\AppData\\Local', 'rectio', 'Cache'));
  });
});

describe('the notice in a real run', () => {
  function project(): string {
    const temp = tempDir('rectio-update-app-');
    cleanups.push(temp.cleanup);
    writeTree(temp.dir, VITE_APP);
    return temp.dir;
  }

  it('goes to stderr after the command, never to stdout', async () => {
    const xdg = cache();
    seed(join(xdg, 'rectio'), { checkedAt: Date.now(), latest: '99.0.0' });
    const run = capture(project(), { XDG_CACHE_HOME: xdg });
    run.ctx.stdoutIsTTY = true;
    expect(await main(['nope'], run.ctx)).toBe(1);
    expect(run.out).toEqual([]);
    // A terminal gets the styled notice: the same words, with color.
    expect(stripVTControlCharacters(run.err.at(-1) ?? '')).toMatch(
      /^ {2}! rectio 99\.0\.0 is available \(you have \d+\.\d+\.\d+\)\n {4}Update with {2}\S+/,
    );
  });

  it('stays quiet when stdout is not a terminal', async () => {
    const xdg = cache();
    seed(join(xdg, 'rectio'), { checkedAt: Date.now(), latest: '99.0.0' });
    const run = capture(project(), { XDG_CACHE_HOME: xdg });
    expect(await main(['nope'], run.ctx)).toBe(1);
    expect(run.err.join('\n')).not.toContain('is available');
  });
});

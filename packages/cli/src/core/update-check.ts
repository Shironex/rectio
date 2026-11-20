import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** npm's answer for the newest published @rectio/cli. */
export const LATEST_URL = 'https://registry.npmjs.org/@rectio/cli/latest';
export const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const CHECK_TIMEOUT_MS = 1500;
export const CACHE_FILE = 'update-check.json';

export interface UpdateCheckOptions {
  /** The running CLI's version. */
  current: string;
  /** The command that ran, such as `add`. Undefined for --help and --version. */
  command: string | undefined;
  env: Readonly<Record<string, string | undefined>>;
  /** Whether stdout is a terminal: piped and machine output never gets the notice. */
  isTTY: boolean;
  // Seams for tests; the defaults are the real ones.
  fetch?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
  cacheDir?: string;
  platform?: NodeJS.Platform;
  home?: string;
  /** Where the running CLI lives, to tell dlx and npx runs from global installs. */
  scriptPath?: string;
}

interface CacheRecord {
  checkedAt: number;
  latest?: string;
}

const on = (value: string | undefined) =>
  value !== undefined && value !== '' && value !== '0' && value.toLowerCase() !== 'false';

/**
 * Never in the MCP server (stdout is the protocol channel), in CI, when stdout is not a terminal,
 * or with RECTIO_NO_UPDATE_CHECK set.
 */
export function updateCheckEnabled(
  options: Pick<UpdateCheckOptions, 'command' | 'env' | 'isTTY'>,
): boolean {
  if (options.command === undefined || options.command === 'mcp') return false;
  if (!options.isTTY) return false;
  return !on(options.env.CI) && !on(options.env.RECTIO_NO_UPDATE_CHECK);
}

/** The per-user cache folder: XDG_CACHE_HOME when set, else the platform's usual place. */
export function cacheDir(
  env: Readonly<Record<string, string | undefined>>,
  platform: NodeJS.Platform = process.platform,
  home: string = homedir(),
): string {
  const xdg = env.XDG_CACHE_HOME;
  if (xdg !== undefined && xdg !== '') return join(xdg, 'rectio');
  if (platform === 'darwin') return join(home, 'Library', 'Caches', 'rectio');
  if (platform === 'win32') {
    return join(env.LOCALAPPDATA ?? join(home, 'AppData', 'Local'), 'rectio', 'Cache');
  }
  return join(home, '.cache', 'rectio');
}

const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

/** True when `latest` is a stable release above `current`. Anything unparsable is not newer. */
export function isNewer(latest: string, current: string): boolean {
  const a = VERSION.exec(latest);
  const b = VERSION.exec(current.split('-')[0] ?? '');
  if (a === null || b === null) return false;
  for (let i = 1; i <= 3; i++) {
    const diff = Number(a[i]) - Number(b[i]);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

function readCache(file: string): CacheRecord | undefined {
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as Partial<CacheRecord>;
    if (typeof raw.checkedAt !== 'number') return undefined;
    return typeof raw.latest === 'string'
      ? { checkedAt: raw.checkedAt, latest: raw.latest }
      : { checkedAt: raw.checkedAt };
  } catch {
    return undefined;
  }
}

function writeCache(dir: string, record: CacheRecord): void {
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, CACHE_FILE), `${JSON.stringify(record)}\n`);
  } catch {
    // A read-only home or a full disk only costs the cache.
  }
}

async function fetchLatest(fetchFn: typeof fetch, timeoutMs: number): Promise<string | undefined> {
  const response = await fetchFn(LATEST_URL, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) return undefined;
  const body = (await response.json()) as { version?: unknown };
  return typeof body.version === 'string' ? body.version : undefined;
}

/**
 * The newest version on npm when it is newer than the running one. Asks npm at most once per
 * CHECK_INTERVAL_MS (a failed ask counts too, so an offline machine does not retry every run).
 */
export async function checkForUpdate(options: UpdateCheckOptions): Promise<string | undefined> {
  const now = (options.now ?? Date.now)();
  const dir = options.cacheDir ?? cacheDir(options.env, options.platform, options.home);
  const cached = readCache(join(dir, CACHE_FILE));
  let latest = cached?.latest;
  const fresh =
    cached !== undefined && now >= cached.checkedAt && now - cached.checkedAt < CHECK_INTERVAL_MS;
  if (!fresh) {
    const fetched = await fetchLatest(
      options.fetch ?? fetch,
      options.timeoutMs ?? CHECK_TIMEOUT_MS,
    ).catch(() => undefined);
    latest = fetched ?? latest;
    writeCache(dir, latest === undefined ? { checkedAt: now } : { checkedAt: now, latest });
  }
  return latest !== undefined && isNewer(latest, options.current) ? latest : undefined;
}

/** How to get the latest, from where the running CLI is installed. */
export function updateCommand(scriptPath: string, command: string | undefined): string {
  const path = scriptPath.replaceAll('\\', '/');
  const args = command === undefined ? '' : ` ${command}`;
  if (path.includes('/_npx/')) return `npx @rectio/cli@latest${args}`;
  if (path.includes('/dlx/')) return `pnpm dlx @rectio/cli@latest${args}`;
  if (/\/pnpm\/global\/|\/\.pnpm-global\//.test(path)) return 'pnpm add -g @rectio/cli@latest';
  if (/\/lib\/node_modules\/@rectio\/cli\/|\/npm\/node_modules\/@rectio\/cli\//.test(path)) {
    return 'npm install -g @rectio/cli@latest';
  }
  return `pnpm dlx @rectio/cli@latest${args}`;
}

export function updateNotice(current: string, latest: string, how: string): string {
  return `\nrectio ${latest} is available (you have ${current}).\nUse it with: ${how}`;
}

/**
 * Starts the check next to the command and resolves to the notice text, or undefined. It never
 * rejects and never takes longer than the timeout: a slow answer is dropped, not awaited.
 */
export function startUpdateCheck(options: UpdateCheckOptions): Promise<string | undefined> {
  if (!updateCheckEnabled(options)) return Promise.resolve(undefined);
  const timeoutMs = options.timeoutMs ?? CHECK_TIMEOUT_MS;
  const check = (async () => {
    const latest = await checkForUpdate({ ...options, timeoutMs });
    if (latest === undefined) return undefined;
    const script = options.scriptPath ?? fileURLToPath(import.meta.url);
    return updateNotice(options.current, latest, updateCommand(script, options.command));
  })().catch(() => undefined);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(resolve, timeoutMs, undefined);
    timer.unref();
  });
  return Promise.race([check, timeout]).finally(() => {
    clearTimeout(timer);
  });
}

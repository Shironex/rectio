import { useCallback, useState, useSyncExternalStore } from 'react';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export const PACKAGE_MANAGERS: readonly PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun'];

/**
 * An npm command in another package manager's words. Understands install (with dev and global
 * flags), uninstall, run, exec (npx), create and init; anything else keeps its arguments and swaps
 * the binary. Each line of a multi-line command converts on its own.
 */
export function toPackageManager(command: string, pm: PackageManager): string {
  return command
    .split('\n')
    .map((line) => convertLine(line.trim(), pm))
    .join('\n');
}

function convertLine(line: string, pm: PackageManager): string {
  if (pm === 'npm' || line === '') return line;
  const npx = /^npx\s+(.+)$/.exec(line);
  if (npx !== null) {
    const rest = npx[1] ?? '';
    return pm === 'pnpm' ? `pnpm dlx ${rest}` : pm === 'yarn' ? `yarn dlx ${rest}` : `bunx ${rest}`;
  }
  const match = /^npm\s+(\S+)(.*)$/.exec(line);
  if (match === null) return line;
  const verb = match[1] ?? '';
  const args = (match[2] ?? '').trim().split(/\s+/).filter(Boolean);
  const dev = args.some((arg) => arg === '-D' || arg === '--save-dev');
  const global = args.some((arg) => arg === '-g' || arg === '--global');
  const packages = args.filter(
    (arg) => !['-D', '--save-dev', '-g', '--global', '--save', '-S'].includes(arg),
  );
  const join = (...parts: string[]) => parts.filter(Boolean).join(' ');
  switch (verb) {
    case 'install':
    case 'i':
    case 'add': {
      if (packages.length === 0) return `${pm} install`;
      if (global) {
        return pm === 'yarn'
          ? join('yarn global add', ...packages)
          : join(pm === 'bun' ? 'bun add -g' : 'pnpm add -g', ...packages);
      }
      return join(`${pm} add`, dev ? '-D' : '', ...packages);
    }
    case 'uninstall':
    case 'remove':
    case 'rm':
      return join(`${pm} remove`, ...packages);
    case 'run':
      return pm === 'bun' ? join('bun run', ...packages) : join(pm, ...packages);
    case 'exec':
      return pm === 'bun' ? join('bunx', ...packages) : join(`${pm} exec`, ...packages);
    case 'create':
    case 'init':
      return join(`${pm} ${verb}`, ...packages);
    default:
      return join(pm, verb, ...packages);
  }
}

/** The event that tells every tab set on the page that a remembered choice changed. */
const EVENT = 'rectio-docs-choice';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * A choice remembered across pages and shared by every tab set with the same key, such as the
 * reader's package manager. Falls back to `fallback` on the server, in a private window, or when
 * the stored value is not one of `options`.
 */
export function usePersistentChoice(
  key: string | undefined,
  options: readonly string[],
  fallback: string,
): [string, (value: string) => void] {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (key === undefined) return () => undefined;
      const onChange = (event: Event) => {
        if (event instanceof StorageEvent && event.key !== key) return;
        notify();
      };
      window.addEventListener('storage', onChange);
      window.addEventListener(EVENT, onChange);
      return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener(EVENT, onChange);
      };
    },
    [key],
  );
  const stored = useSyncExternalStore(
    subscribe,
    () => (key === undefined ? null : read(key)),
    () => null,
  );
  // This page's own choice: used when nothing is stored or storage refuses the write.
  const [local, setLocal] = useState<string | null>(null);
  const value =
    stored !== null && options.includes(stored)
      ? stored
      : local !== null && options.includes(local)
        ? local
        : fallback;
  const set = useCallback(
    (next: string) => {
      setLocal(next);
      if (key === undefined) return;
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Storage refused (private mode, quota): the choice lasts for this page only.
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );
  return [value, set];
}

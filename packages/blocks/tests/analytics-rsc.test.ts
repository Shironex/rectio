import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// The analytics blocks draw charts, so their components are client modules; their logic (the
// conversion, the pace, the breakdown) must still run in a server component, which may compute the
// figures before it renders anything. A logic module stays free of 'use client', and every helper
// it takes from @rectio/ui/charts must come from a module that is free of it too: a client module's
// exports are references on the server, and calling one throws.
const ROOT = join(import.meta.dirname, '../src/analytics');
const UI = join(import.meta.dirname, '../../ui/src');

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(dir, entry.name))
      : /\.tsx?$/.test(entry.name)
        ? [join(dir, entry.name)]
        : [],
  );
}

const sources = files(ROOT).map((path) => ({
  path: relative(ROOT, path),
  source: readFileSync(path, 'utf8'),
}));
const isClient = (source: string) => /^\s*'use client';/.test(source);

/** Where each value the charts entry exports comes from, as a path under packages/ui/src. */
function chartsExports(): Map<string, string> {
  const entry = readFileSync(join(UI, 'charts.ts'), 'utf8');
  const map = new Map<string, string>();
  for (const match of entry.matchAll(/^export\s+\{([^}]*)\}\s+from\s+'\.\/([^']+)'/gm)) {
    for (const part of (match[1] ?? '').split(',')) {
      const name = part.trim();
      if (name === '' || name.startsWith('type ')) continue;
      map.set(name.split(/\s+as\s+/).pop() ?? name, match[2] ?? '');
    }
  }
  return map;
}

function uiSource(module: string): string {
  for (const ext of ['.ts', '.tsx']) {
    try {
      return readFileSync(join(UI, `${module}${ext}`), 'utf8');
    } catch {
      // Try the other extension.
    }
  }
  throw new Error(`no source for ${module}`);
}

const CLIENT_STATE = /\b(useState|useEffect|useLayoutEffect|useRef|useContext|useReducer)\b/;

describe('analytics blocks on the server', () => {
  const logic = sources.filter(({ path }) => path.endsWith('.logic.ts'));

  it('keeps every logic module free of the client directive', () => {
    expect(logic.length).toBe(4);
    expect(logic.filter(({ source }) => isClient(source)).map(({ path }) => path)).toEqual([]);
  });

  it('takes chart helpers into logic only from server-safe ui modules', () => {
    const origin = chartsExports();
    const offenders = logic.flatMap(({ path, source }) =>
      [...source.matchAll(/^import\s+\{([^}]*)\}\s+from\s+'@rectio\/ui\/charts'/gm)].flatMap(
        (match) =>
          (match[1] ?? '')
            .split(',')
            .map((part) => part.trim())
            .filter((name) => name !== '' && !name.startsWith('type '))
            .filter((name) => {
              const module = origin.get(name);
              return module === undefined || isClient(uiSource(module));
            })
            .map((name) => `${path}: ${name}`),
      ),
    );
    expect(offenders).toEqual([]);
  });

  it('marks every component that holds state as a client module', () => {
    const missing = sources
      .filter(({ source }) => CLIENT_STATE.test(source) && !isClient(source))
      .map(({ path }) => path);
    expect(missing).toEqual([]);
  });
});

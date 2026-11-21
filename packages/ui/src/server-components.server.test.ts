import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { exportedNames, isClientModule } from '../test/client-boundary';

/**
 * @rectio/ui imported from a React Server Component. This file runs on React's server build with
 * every 'use client' module replaced by client references, the way Next bundles a server page, so
 * a module that reaches for context or state without the directive fails here first.
 */

const ROOT = import.meta.dirname;

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

const modules = sources(ROOT).map((path) => ({
  path,
  name: relative(ROOT, path),
  source: readFileSync(path, 'utf8'),
}));
const byPath = new Map(modules.map((module) => [module.path, module]));

/** React names a server component cannot use: state, effects, refs and context. */
const CLIENT_NAMES =
  'useState|useEffect|useLayoutEffect|useRef|useContext|useReducer|useSyncExternalStore|useId|useMemo|useCallback|createContext|use';
const CLIENT_ONLY = new RegExp(`\\b(${CLIENT_NAMES})\\b`);

/**
 * Whether a module reaches for state, effects or context: through named imports from react, or
 * through a namespace or default import (`import * as React`, `import React`) used as `React.useX`.
 */
function holdsClientState(source: string): boolean {
  const named = [...source.matchAll(/^import\s+(?!type\b)\{([^}]*)\}\s+from\s+'react'/gm)]
    .map((match) => match[1] ?? '')
    .join(',');
  if (CLIENT_ONLY.test(named)) return true;
  const namespaces = [
    ...source.matchAll(
      /^import\s+(?!type\b)(?:\*\s+as\s+(\w+)|(\w+))(?:\s*,\s*\{[^}]*\})?\s+from\s+'react'/gm,
    ),
  ].map((match) => match[1] ?? match[2] ?? '');
  return namespaces.some((name) => new RegExp(`\\b${name}\\.(${CLIENT_NAMES})\\b`).test(source));
}

const localImports = (module: (typeof modules)[number]) =>
  [...module.source.matchAll(/^import\s+(?!type\b)\{([^}]*)\}\s+from\s+'(\.[^']+)'/gm)].map(
    (match) => {
      const base = resolve(dirname(module.path), match[2] ?? '');
      const target = byPath.get(`${base}.tsx`) ?? byPath.get(`${base}.ts`);
      const names = (match[1] ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name !== '' && !name.startsWith('type '));
      return { target, names };
    },
  );

// The first two tests import the whole package root cold, which takes seconds on a busy machine.
describe('@rectio/ui in a React Server Component', { timeout: 30_000 }, () => {
  it('imports from the package root on the server', async () => {
    const kit = await import('./index');
    expect(Object.keys(kit).length).toBeGreaterThan(150);
  });

  it('runs the plain helpers on the server', async () => {
    const kit = await import('./index');
    expect(kit.cn('px-2', 'px-4')).toBe('px-4');
    expect(kit.formatMoney(1234.5, 'EUR', { locale: 'en-GB' })).toContain('1,234.50');
    expect(kit.initials('Ana María Ruiz')).toBe('AR');
    expect(kit.meterLevel(90, { warning: 75, critical: 90 })).toBe('critical');
    expect(kit.paginationRange(1, 3)).toEqual([1, 2, 3]);
    expect(kit.collapseBreadcrumb([1, 2, 3, 4, 5], 3).hidden).toEqual([2, 3]);
    expect(kit.shortcutLabel('mod+k', false)).toBe('Control K');
    expect(kit.formatFileSize(2048, 'en-GB')).toBe('2 kB');
    expect(kit.isExternalHref('https://example.com')).toBe(true);
    for (const style of [
      kit.popupSurface,
      kit.popoverSurface,
      kit.menuItem,
      kit.comboboxSurface,
      kit.tagRemoveButton,
    ]) {
      // The class list itself, not a client reference standing in for it.
      expect(style.split(' ').length).toBeGreaterThan(1);
    }
  });

  it('marks every module that holds state, effects or context as a client module', () => {
    const missing = modules
      .filter(({ source }) => holdsClientState(source) && !isClientModule(source))
      .map(({ name }) => name);
    expect(missing).toEqual([]);
  });

  it('sees state behind a namespace or default import of react, not only named imports', () => {
    expect(holdsClientState("import { useState } from 'react';")).toBe(true);
    expect(holdsClientState("import * as React from 'react';\nReact.useRef(null);")).toBe(true);
    expect(holdsClientState("import R from 'react';\nconst c = R.createContext(0);")).toBe(true);
    expect(holdsClientState("import React, { type ReactNode } from 'react';\nReact.use(p);")).toBe(
      true,
    );
    expect(holdsClientState("import * as React from 'react';\ntype P = React.ReactNode;")).toBe(
      false,
    );
    expect(holdsClientState("import type { ReactNode } from 'react';")).toBe(false);
  });

  it('loads icons from the server-safe entry outside client modules', () => {
    const offenders = modules
      .filter(
        ({ source }) => !isClientModule(source) && source.includes("from '@phosphor-icons/react';"),
      )
      .map(({ name }) => name);
    expect(offenders).toEqual([]);
  });

  it('never takes a plain value from a client module into a server module', () => {
    // A client module's exports are references on the server: a component renders, but a class
    // string or a helper would arrive as a reference instead of its value.
    const offenders = modules
      .filter(({ source }) => !isClientModule(source))
      .flatMap((module) =>
        localImports(module)
          .filter(({ target }) => target !== undefined && isClientModule(target.source))
          .flatMap(({ target, names }) =>
            names
              .filter((name) => !/^[A-Z]/.test(name.split(/\s+as\s+/)[0] ?? name))
              .map((name) => `${module.name}: ${name} from ${target?.name ?? ''}`),
          ),
      );
    expect(offenders).toEqual([]);
  });

  it('exports every plain helper from a server-safe module', () => {
    const index = byPath.get(join(ROOT, 'index.ts'));
    const offenders = index === undefined ? ['index.ts'] : [];
    for (const { target, names } of index === undefined ? [] : localImportsOfIndex(index.source)) {
      if (target === undefined || !isClientModule(target.source)) continue;
      const plain = names.filter((name) => !/^[A-Z]/.test(name) && !/^use[A-Z]/.test(name));
      const allowed = CLIENT_HELPERS.get(target.name) ?? [];
      offenders.push(
        ...plain
          .filter((name) => !allowed.includes(name))
          .map((name) => `${name} (${target.name})`),
      );
    }
    expect(offenders).toEqual([]);
  });

  it('reads export names the way the boundary does', () => {
    expect(
      exportedNames('export function A() {}\nexport const b = 1;\nexport { c, d as e };'),
    ).toEqual(['A', 'b', 'c', 'e']);
  });
});

/**
 * Helpers that only make sense beside their interactive component (column builders, the command
 * filter), so they stay in its client module.
 */
const CLIENT_HELPERS = new Map<string, string[]>([
  ['data-table/data-table.tsx', ['dataTableFeatures', 'selectionColumn']],
  ['command-menu/command-menu.tsx', ['filterCommands']],
]);

function localImportsOfIndex(source: string) {
  return [...source.matchAll(/^export\s+\{([^}]*)\}\s+from\s+'(\.[^']+)'/gm)].map((match) => {
    const base = resolve(ROOT, match[2] ?? '');
    const target = byPath.get(`${base}.tsx`) ?? byPath.get(`${base}.ts`);
    const names = (match[1] ?? '')
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name !== '' && !name.startsWith('type '));
    return { target, names };
  });
}

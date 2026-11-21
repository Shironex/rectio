import { readFileSync } from 'node:fs';

import type { ViteUserConfig } from 'vitest/config';

type Plugin = Extract<NonNullable<ViteUserConfig['plugins']>[number], { name: string }>;

/** True when a module's source opens with the 'use client' directive, as a bundler reads it. */
export function isClientModule(source: string): boolean {
  return /^(?:\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)|\s*['"]use strict['"];?)*\s*['"]use client['"]/.test(
    source,
  );
}

/** The names a module exports, read from its source. Type-only exports are left out. */
export function exportedNames(source: string): string[] {
  const names = new Set<string>();
  for (const match of source.matchAll(
    /^export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm,
  )) {
    names.add(match[1] ?? '');
  }
  for (const match of source.matchAll(/^export\s+(?!type\b)\{([^}]*)\}/gm)) {
    for (const part of (match[1] ?? '').split(',')) {
      const item = part.trim();
      if (item === '' || item.startsWith('type ')) continue;
      const alias = item.split(/\s+as\s+/).pop() ?? item;
      names.add(alias.trim());
    }
  }
  names.delete('');
  return [...names];
}

/**
 * What a React Server Components bundler does at a 'use client' boundary: the module is not run on
 * the server, and each export becomes a client reference. Rendering one is fine; calling one on the
 * server throws, as it would in a real app. With this plugin and the `react-server` condition, a
 * test can import the kit the way a server component does.
 */
export function clientBoundary(): Plugin {
  return {
    name: 'rectio:client-boundary',
    enforce: 'pre',
    load(id: string) {
      const path = id.split('?')[0] ?? id;
      if (!/\.(?:[cm]?[jt]sx?)$/.test(path) || path.includes('/vitest/')) return null;
      let source: string;
      try {
        source = readFileSync(path, 'utf8');
      } catch {
        return null;
      }
      if (!isClientModule(source)) return null;
      const lines = exportedNames(source).map(
        (name) =>
          `export const ${name} = Object.defineProperties(function () { throw new Error(${JSON.stringify(
            `${name} is a client reference and cannot run on the server`,
          )}); }, { $$typeof: { value: Symbol.for('react.client.reference') }, $$id: { value: ${JSON.stringify(
            `${path}#${name}`,
          )} } });`,
      );
      return { code: lines.join('\n') || 'export {};', map: null };
    },
  };
}

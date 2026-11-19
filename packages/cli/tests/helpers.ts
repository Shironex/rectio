import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  itemIntegrity,
  itemPath,
  sha256Hex,
  type RegistryIndex,
  type RegistryItem,
} from '@rectio/registry';
import { buildRegistry, writeRegistry } from '@rectio/registry/build';
import config from '@rectio/registry/config';

import type { CliContext } from '../src/core/context.ts';

export function tempDir(prefix: string): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  return {
    dir,
    cleanup: () => {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export function writeTree(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
}

export const read = (root: string, path: string) => readFileSync(join(root, path), 'utf8');

/** A pro block that depends on free items, added to the built registry by hand. */
export function proItem(): RegistryItem {
  const content =
    'import { Money } from \'@registry/ui/money\';\n\nexport function LedgerSummary() {\n  return <Money amount={-12.5} currency="EUR" />;\n}\n';
  const body = {
    schemaVersion: 1 as const,
    name: 'ledger-summary',
    version: '1.0.0',
    type: 'block' as const,
    tier: 'pro' as const,
    title: 'Ledger summary',
    description: 'A pro block.',
    categories: ['finance'],
    dependencies: {},
    devDependencies: {},
    registryDependencies: ['money'],
    requires: {},
    files: [
      {
        path: 'blocks/ledger-summary.tsx',
        type: 'block' as const,
        target: '@blocks/ledger-summary.tsx',
        content,
        sha256: sha256Hex(content),
      },
    ],
    cssVars: { light: { '--rx-ledger-summary-gap': '1rem' } },
  };
  return { ...body, integrity: itemIntegrity(body) };
}

/** The real rectio registry plus one pro item, written to a temp folder. */
export function buildTestRegistry(): { dir: string; url: string; cleanup: () => void } {
  const temp = tempDir('rectio-cli-registry-');
  const result = buildRegistry(config);
  writeRegistry(temp.dir, result);
  const pro = proItem();
  for (const version of [undefined, pro.version]) {
    const path = join(temp.dir, itemPath(pro.name, 'pro', version));
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(pro));
  }
  const indexFile = join(temp.dir, 'index.json');
  const index = JSON.parse(readFileSync(indexFile, 'utf8')) as RegistryIndex;
  index.items.push({
    name: pro.name,
    type: pro.type,
    tier: pro.tier,
    version: pro.version,
    versions: [pro.version],
    title: pro.title,
    description: pro.description,
    categories: pro.categories,
    registryDependencies: pro.registryDependencies,
  });
  writeFileSync(indexFile, JSON.stringify(index));
  return { ...temp, url: pathToFileURL(temp.dir).href };
}

/** A Vite app as the CLI sees it, without node_modules. */
export const VITE_APP: Record<string, string> = {
  'package.json': `${JSON.stringify(
    {
      name: 'fixture',
      private: true,
      type: 'module',
      dependencies: { react: '^19.3.1', 'react-dom': '^19.3.1' },
      devDependencies: { vite: '^8.3.8', tailwindcss: '^4.3.5', '@tailwindcss/vite': '^4.3.5' },
    },
    null,
    2,
  )}\n`,
  'tsconfig.json': '{\n  "files": [],\n  "references": [{ "path": "./tsconfig.app.json" }]\n}\n',
  'tsconfig.app.json':
    '{\n  // Vite style: comments and trailing commas\n  "compilerOptions": {\n    "paths": { "@/*": ["./src/*"], },\n  },\n  "include": ["src"],\n}\n',
  'src/index.css': '@import "tailwindcss";\n\nbody {\n  margin: 0;\n}\n',
};

export interface Captured {
  ctx: CliContext;
  out: string[];
  err: string[];
}

export function capture(cwd: string, env: Record<string, string | undefined> = {}): Captured {
  const out: string[] = [];
  const err: string[] = [];
  return {
    out,
    err,
    ctx: {
      cwd,
      // An empty config home, so a real key on the machine never leaks into a test.
      env: { XDG_CONFIG_HOME: join(cwd, '.no-config'), APPDATA: join(cwd, '.no-config'), ...env },
      log: (line) => out.push(line),
      warn: (line) => err.push(line),
    },
  };
}

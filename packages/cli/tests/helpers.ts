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

/** A block that depends on kit items, added to the built registry by hand. */
export function blockItem(): RegistryItem {
  const content =
    'import { Money } from \'@registry/ui/money\';\n\nexport function LedgerSummary() {\n  return <Money amount={-12.5} currency="EUR" />;\n}\n';
  const body = {
    schemaVersion: 1 as const,
    name: 'ledger-summary',
    version: '1.0.0',
    type: 'block' as const,
    title: 'Ledger summary',
    description: 'A finance block.',
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

/** A small template on the real kit items, added to the built registry by hand. */
export function templateItem(): RegistryItem {
  const file = (path: string, content: string) => ({
    path: `template/${path}`,
    type: 'template' as const,
    target: `@project/${path}`,
    content,
    sha256: sha256Hex(content),
  });
  const body = {
    schemaVersion: 1 as const,
    name: 'books',
    version: '0.3.0',
    type: 'template' as const,
    title: 'Books',
    description: 'A small bookkeeping app.',
    categories: ['template', 'app'],
    dependencies: {},
    devDependencies: {},
    registryDependencies: ['button', 'money', 'theme-default', 'theme-ledger', 'tokens'],
    requires: {},
    files: [
      file(
        'package.json',
        `${JSON.stringify({ name: 'books', version: '0.3.0', private: true, dependencies: { next: '16.4.6' } }, null, 2)}\n`,
      ),
      file('tsconfig.json', '{\n  "compilerOptions": { "paths": { "@/*": ["./*"] } }\n}\n'),
      file('app/globals.css', "@import 'tailwindcss';\n\nbody {\n  margin: 0;\n}\n"),
      file(
        'app/page.tsx',
        "import { Button } from '@registry/ui/button';\nimport { Money } from '@registry/ui/money';\n\nexport default function Page() {\n  return <Button><Money amount={1} currency=\"EUR\" /></Button>;\n}\n",
      ),
    ],
    template: {
      category: 'app' as const,
      framework: 'next' as const,
      pages: ['/'],
      uses: ['button', 'money'],
      screenshots: ['screenshots/desktop-light.webp'],
    },
  };
  return { ...body, integrity: itemIntegrity(body) };
}

/**
 * A skin item shaped like the ones the registry build makes, added to the built registry by
 * hand until the registry publishes its own skins.
 */
export function skinItem(id: string): RegistryItem {
  const content = `[data-skin="${id}"] {\n  --rx-radius-md: 2px;\n}\n`;
  const body = {
    schemaVersion: 1 as const,
    name: `skin-${id}`,
    version: '0.1.0',
    type: 'skin' as const,
    title: `${id} skin`,
    description: `The ${id} skin.`,
    categories: ['skin'],
    dependencies: {},
    devDependencies: {},
    registryDependencies: ['tokens'],
    requires: {},
    files: [
      {
        path: `styles/skins/${id}.css`,
        type: 'skin' as const,
        target: `@styles/skins/${id}.css`,
        content,
        sha256: sha256Hex(content),
      },
    ],
    skin: { id, tokens: ['--rx-radius-md'] },
    docs: `Set data-skin="${id}" on <html> (or skin="${id}" on a ThemeScope) to use it.`,
  };
  return { ...body, integrity: itemIntegrity(body) };
}

/** Writes a hand-made item into a built registry folder: its body and its index entry. */
function publish(dir: string, item: RegistryItem): void {
  for (const version of [undefined, item.version]) {
    const path = join(dir, itemPath(item.name, version));
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(item));
  }
  const indexFile = join(dir, 'index.json');
  const index = JSON.parse(readFileSync(indexFile, 'utf8')) as RegistryIndex;
  index.items.push({
    name: item.name,
    type: item.type,
    version: item.version,
    versions: [item.version],
    title: item.title,
    description: item.description,
    categories: item.categories,
    registryDependencies: item.registryDependencies,
  });
  writeFileSync(indexFile, JSON.stringify(index));
}

/**
 * The real rectio registry plus one block, one small template and two skins, written to a temp
 * folder.
 */
export function buildTestRegistry(): { dir: string; url: string; cleanup: () => void } {
  const temp = tempDir('rectio-cli-registry-');
  // The real templates are covered by the end-to-end test; command tests use the small one.
  const kit = { ...config };
  delete kit.templates;
  writeRegistry(temp.dir, buildRegistry(kit));
  publish(temp.dir, blockItem());
  publish(temp.dir, templateItem());
  publish(temp.dir, skinItem('dense'));
  publish(temp.dir, skinItem('editorial'));
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
      env,
      log: (line) => out.push(line),
      warn: (line) => err.push(line),
      // A stopped clock: step durations read 0.0s, so the output is stable.
      now: () => 0,
    },
  };
}

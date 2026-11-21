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
    ...(item.deprecated === undefined ? {} : { deprecated: item.deprecated }),
  });
  writeFileSync(indexFile, JSON.stringify(index));
}

/**
 * A second, deprecated theme, made from the built default one. The real registry ships one theme
 * and nothing deprecated, but the CLI still handles both, so the command tests keep a fixture.
 */
function deprecatedThemeItem(dir: string): RegistryItem {
  const base = JSON.parse(
    readFileSync(join(dir, itemPath('theme-default')), 'utf8'),
  ) as RegistryItem;
  const files = base.files.map((file) => {
    const content = file.content.replaceAll('"default"', '"ledger"');
    return {
      ...file,
      path: file.path.replace('default.css', 'ledger.css'),
      target: file.target.replace('default.css', 'ledger.css'),
      content,
      sha256: sha256Hex(content),
    };
  });
  const body = {
    ...base,
    name: 'theme-ledger',
    version: '0.2.4',
    title: 'Ledger theme',
    description:
      'Deprecated: build your own from the ledger look in the theme generator. Green-black ink, citron accent, 2px corners, Source Serif 4 headings.',
    deprecated:
      'The ledger theme is no longer built in and will be removed in the next release. Make your own from the ledger look in the theme generator: https://shironex.github.io/rectio/docs/theming/generator',
    // As the last published ledger theme: its own heading fonts, the tokens, and usage notes.
    dependencies: {
      ...base.dependencies,
      '@fontsource-variable/schibsted-grotesk': '^5.3.0',
      '@fontsource-variable/source-serif-4': '^5.3.1',
    },
    registryDependencies: ['tokens'],
    docs: 'Set data-theme="ledger" on <html> (or wrap a subtree in ThemeScope) to use it.',
    files,
    ...(base.theme === undefined ? {} : { theme: { ...base.theme, id: 'ledger' } }),
  };
  // itemIntegrity hashes the body without its integrity field, so the copied one is replaced.
  return { ...body, integrity: itemIntegrity(body) };
}

/** The real rectio registry plus a deprecated theme, one block and one small template, in a temp folder. */
export function buildTestRegistry(): { dir: string; url: string; cleanup: () => void } {
  const temp = tempDir('rectio-cli-registry-');
  // The real templates are covered by the end-to-end test; command tests use the small one.
  const kit = { ...config };
  delete kit.templates;
  writeRegistry(temp.dir, buildRegistry(kit));
  publish(temp.dir, deprecatedThemeItem(temp.dir));
  publish(temp.dir, blockItem());
  publish(temp.dir, templateItem());
  return { ...temp, url: pathToFileURL(temp.dir).href };
}

/** An item's version in the real registry config, so tests follow its bumps instead of pinning them. */
export function registryVersion(name: string): string {
  const item = config.items.find((entry) => entry.name === name);
  if (item === undefined) throw new Error(`no registry item named ${name}`);
  return item.version;
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

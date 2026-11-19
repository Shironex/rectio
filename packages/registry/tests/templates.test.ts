import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { buildRegistry, writeRegistry } from '../src/build/index.ts';
import { registryItemSchema, type RegistryItem } from '../src/index.ts';
import { FIXTURE_SOURCES, fixtureConfig, tempTree } from './helpers.ts';

let cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups) cleanup();
  cleanups = [];
});

const MANIFEST = {
  name: 'books',
  title: 'Books',
  description: 'A small app.',
  category: 'app',
  tier: 'pro',
  pages: ['/'],
  uses: ['badge', 'ledger-card'],
  screenshots: ['screenshots/desktop-light.webp'],
};

const TEMPLATE: Record<string, string> = {
  'templates/books/template.json': JSON.stringify(MANIFEST),
  'templates/books/turbo.json': '{}\n',
  'templates/books/screenshots/desktop-light.webp': 'not shipped',
  'templates/books/scripts/shoot.ts': '// repo tooling\n',
  'templates/books/package.json': JSON.stringify({
    name: '@fixture/template-books',
    version: '1.2.0',
    private: true,
    license: 'UNLICENSED',
    scripts: { dev: 'next dev', build: 'next build', lint: 'eslint .', shoot: 'node x' },
    dependencies: { '@fixture/base': 'workspace:*', next: '16.4.6', react: '^19.3.1' },
    devDependencies: { playwright: '^1.65.0', tailwindcss: '^4.3.5' },
  }),
  'templates/books/next.config.ts':
    "const config = {\n  output: 'export',\n  transpilePackages: ['@fixture/base'], // rectio:workspace\n};\nexport default config;\n",
  'templates/books/app/globals.css':
    "@import 'tailwindcss';\r\n@source '../../../src'; /* rectio:workspace */\r\nbody { margin: 0; }\r\n",
  'templates/books/app/page.tsx':
    "import Link from 'next/link';\nimport { Badge, LedgerCard } from '@fixture/base';\nimport { total } from '@/data/books';\nimport { Row } from '../components/row';\n\nexport default function Page() {\n  return <Link href=\"/\"><Badge>{total}</Badge><LedgerCard /><Row /></Link>;\n}\n",
  'templates/books/components/row.tsx': 'export const Row = () => null;\n',
  'templates/books/data/books.ts': 'export const total = 3;\n',
};

function build(extra: Record<string, string> = {}) {
  const tree = tempTree({
    ...FIXTURE_SOURCES,
    'base/index.ts':
      "export { Badge } from '../src/badge/badge';\nexport * from '../src/ledger-card/ledger-card';\n",
    ...TEMPLATE,
    ...extra,
  });
  cleanups.push(tree.cleanup);
  const config = {
    ...fixtureConfig(tree.dir),
    workspacePackages: { '@fixture/base': join(tree.dir, 'base/index.ts') },
    templates: { dir: join(tree.dir, 'templates') },
  };
  return { dir: tree.dir, config, run: () => buildRegistry(config) };
}

const fileOf = (item: RegistryItem | undefined, path: string) =>
  item?.files.find((f) => f.path === `template/${path}`)?.content;

describe('template items', () => {
  it('builds a pro template item from template.json and the folder', () => {
    const result = build().run();
    const item = result.items.find((i) => i.name === 'books');
    expect(item).toBeDefined();
    expect(registryItemSchema.parse(item)).toBeTruthy();
    expect(item?.type).toBe('template');
    expect(item?.tier).toBe('pro');
    expect(item?.version).toBe('1.2.0');
    expect(item?.categories).toEqual(['template', 'app']);
    expect(item?.registryDependencies).toEqual(['badge', 'ledger-card']);
    expect(item?.template).toMatchObject({ category: 'app', pages: ['/'], framework: 'next' });
    expect(item?.files.map((f) => f.path).sort()).toEqual([
      'template/app/globals.css',
      'template/app/page.tsx',
      'template/components/row.tsx',
      'template/data/books.ts',
      'template/next.config.ts',
      'template/package.json',
    ]);
    for (const file of item?.files ?? []) {
      expect(file.type).toBe('template');
      expect(file.target).toBe(`@project/${file.path.slice('template/'.length)}`);
    }
    const entry = result.index.items.find((i) => i.name === 'books');
    expect(entry).toMatchObject({ type: 'template', tier: 'pro' });
    expect(JSON.stringify(entry)).not.toContain('content');
  });

  it('rewrites workspace imports, follows export * and keeps local imports', () => {
    const page = fileOf(
      build()
        .run()
        .items.find((i) => i.name === 'books'),
      'app/page.tsx',
    );
    expect(page).toContain("import { Badge } from '@registry/ui/badge';");
    expect(page).toContain("import { LedgerCard } from '@registry/blocks/ledger-card';");
    expect(page).toContain("import { total } from '@/data/books';");
    expect(page).toContain("import { Row } from '../components/row';");
    expect(page).not.toContain('@fixture/base');
  });

  it('drops workspace-only lines with LF endings and strips the package.json', () => {
    const item = build()
      .run()
      .items.find((i) => i.name === 'books');
    expect(fileOf(item, 'app/globals.css')).toBe("@import 'tailwindcss';\nbody { margin: 0; }\n");
    expect(fileOf(item, 'next.config.ts')).not.toContain('transpilePackages');
    const pkg = JSON.parse(fileOf(item, 'package.json') ?? '{}') as Record<string, unknown>;
    expect(pkg).toEqual({
      name: 'books',
      version: '1.2.0',
      private: true,
      scripts: { dev: 'next dev', build: 'next build' },
      dependencies: { next: '16.4.6', react: '^19.3.1' },
      devDependencies: { tailwindcss: '^4.3.5' },
    });
  });

  it('writes the template body under pro/ only', () => {
    const { dir, run } = build();
    const out = join(dir, 'out');
    writeRegistry(out, run());
    expect(existsSync(join(out, 'pro/items/books.json'))).toBe(true);
    expect(existsSync(join(out, 'pro/items/books@1.2.0.json'))).toBe(true);
    expect(existsSync(join(out, 'items/books.json'))).toBe(false);
    expect(readFileSync(join(out, 'index.json'), 'utf8')).not.toContain('@registry/');
  });

  it('fails when "uses" does not match the imports', () => {
    const { run } = build({
      'templates/books/template.json': JSON.stringify({ ...MANIFEST, uses: ['badge', 'toggle'] }),
    });
    expect(run).toThrow(/"uses" is missing ledger-card[\s\S]*lists toggle, which it never imports/);
  });

  it('fails on an npm import its package.json does not declare', () => {
    const { run } = build({
      'templates/books/components/row.tsx':
        "import { clsx } from 'clsx';\nexport const Row = clsx;\n",
    });
    expect(run).toThrow('components/row.tsx imports clsx, which its package.json does not declare');
  });

  it('fails on a file where kit items install and on a workspace line left unmarked', () => {
    const { run } = build({
      'templates/books/lib/cn.ts': 'export const cn = 1;\n',
      'templates/books/app/extra.css': "@import '@fixture/tokens/a.css';\n",
    });
    expect(run).toThrow(
      /app\/extra\.css still names[\s\S]*lib\/cn\.ts sits where kit items install/,
    );
  });

  it('fails on a missing screenshot or a folder that does not match the name', () => {
    const missing = build({
      'templates/books/template.json': JSON.stringify({
        ...MANIFEST,
        screenshots: ['screenshots/phone.webp'],
      }),
    });
    expect(missing.run).toThrow('screenshots/phone.webp does not exist');
    const renamed = build({
      'templates/books/template.json': JSON.stringify({ ...MANIFEST, name: 'ledger' }),
    });
    expect(renamed.run).toThrow('the folder name must be "ledger"');
  });

  it('rejects a template file outside a template item, and a template without its meta', () => {
    const item = build()
      .run()
      .items.find((i) => i.name === 'books');
    expect(registryItemSchema.safeParse({ ...item, type: 'block' }).success).toBe(false);
    expect(registryItemSchema.safeParse({ ...item, template: undefined }).success).toBe(false);
  });
});

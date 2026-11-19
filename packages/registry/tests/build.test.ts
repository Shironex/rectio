import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import config from '../registry.config.ts';
import {
  buildRegistry,
  findImports,
  fontSlug,
  packageName,
  replaceImports,
  splitBlocks,
  writeRegistry,
} from '../src/build/index.ts';
import { registryItemSchema, verifyItem } from '../src/index.ts';
import { FIXTURE_SOURCES, fixtureConfig, fixtureItem, tempTree } from './helpers.ts';

let cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups) cleanup();
  cleanups = [];
});
function fixture(extra: Record<string, string> = {}) {
  const tree = tempTree({ ...FIXTURE_SOURCES, ...extra });
  cleanups.push(tree.cleanup);
  return tree.dir;
}

describe('imports', () => {
  it('finds static, type, re-export, dynamic and side-effect imports but not strings', () => {
    const source = [
      "import { a } from '../lib/cn';",
      'import type { X } from "react";',
      "export { b } from './b';",
      "const c = await import('./c');",
      "import './side.css';",
      'const text = "import x from \'fake\'";',
      "// import y from 'commented'",
    ].join('\n');
    expect(findImports(source).map((s) => s.specifier)).toEqual([
      '../lib/cn',
      'react',
      './b',
      './c',
      './side.css',
    ]);
  });

  it('replaces specifiers in place', () => {
    const source = 'import { a } from \'../a\';\nimport { b } from "../b";\n';
    const out = replaceImports(source, findImports(source), (s) => s.replace('..', '@registry/ui'));
    expect(out).toBe(
      'import { a } from \'@registry/ui/a\';\nimport { b } from "@registry/ui/b";\n',
    );
  });

  it('maps a deep import to its package', () => {
    expect(packageName('@base-ui/react/button')).toBe('@base-ui/react');
    expect(packageName('motion/react')).toBe('motion');
    expect(packageName('clsx')).toBe('clsx');
  });
});

describe('buildRegistry on a fixture', () => {
  it('computes dependencies, rewrites imports, normalises line endings and hashes', () => {
    const { items, index } = buildRegistry(fixtureConfig(fixture()));
    const byName = new Map(items.map((i) => [i.name, i]));

    const badge = byName.get('badge');
    expect(badge?.registryDependencies).toEqual(['cn']);
    expect(badge?.dependencies).toEqual({});
    expect(badge?.requires.react).toBe('^19.0.0');
    expect(badge?.files[0]).toMatchObject({ path: 'ui/badge.tsx', target: '@ui/badge.tsx' });
    expect(badge?.files[0]?.content).toContain("from '@registry/lib/cn'");
    expect(badge?.files[0]?.content).not.toContain('\r');
    // No hook, no UI package: stays a server-safe module.
    expect(badge?.files[0]?.content.startsWith("'use client'")).toBe(false);

    const toggle = byName.get('toggle');
    expect(toggle?.dependencies).toEqual({ '@base-ui/react': '^1.9.0' });
    expect(toggle?.files[0]?.content.startsWith("'use client';\n\n")).toBe(true);

    const card = byName.get('ledger-card');
    expect(card).toMatchObject({ tier: 'pro', type: 'block', version: '2.1.0' });
    expect(card?.dependencies).toEqual({ motion: '^14.0.0' });
    expect(card?.registryDependencies).toEqual(['badge']);
    expect(card?.files[0]?.target).toBe('@blocks/ledger-card.tsx');

    const cn = byName.get('cn');
    expect(cn?.files[0]).toMatchObject({ path: 'lib/cn.ts', target: '@lib/cn.ts', type: 'lib' });

    for (const item of items) {
      expect(registryItemSchema.safeParse(item).success).toBe(true);
      expect(verifyItem(item)).toEqual([]);
    }
    expect(index.items.map((i) => [i.name, i.tier])).toEqual([
      ['badge', 'free'],
      ['cn', 'free'],
      ['ledger-card', 'pro'],
      ['toggle', 'free'],
    ]);
  });

  it('is deterministic', () => {
    const dir = fixture();
    expect(buildRegistry(fixtureConfig(dir))).toEqual(buildRegistry(fixtureConfig(dir)));
  });

  it('fails on an import no package.json declares', () => {
    const dir = fixture({
      'src/badge/badge.tsx': "import dayjs from 'dayjs';\nexport const d = dayjs;\n",
    });
    expect(() => buildRegistry(fixtureConfig(dir))).toThrow(
      'badge: badge/badge.tsx imports dayjs, which no package.json declares',
    );
  });

  it('fails on a relative import outside every item', () => {
    const dir = fixture({
      'src/badge/badge.tsx': "import { x } from '../internal/x';\nexport const y = x;\n",
      'src/internal/x.ts': 'export const x = 1;\n',
    });
    const items = fixtureConfig(dir).items;
    expect(() =>
      buildRegistry({ ...fixtureConfig(dir, items), requireEveryFolder: false }),
    ).toThrow('imports ../internal/x, which is in no item');
  });

  it('fails on a source folder no item lists', () => {
    const dir = fixture({ 'src/chart/chart.tsx': 'export const Chart = 1;\n' });
    expect(() => buildRegistry(fixtureConfig(dir))).toThrow(
      'folder chart/ belongs to no registry item',
    );
  });

  it('fails when a free item depends on a pro one', () => {
    const dir = fixture({
      'src/badge/badge.tsx':
        "import { LedgerCard } from '../ledger-card/ledger-card';\nexport const B = LedgerCard;\n",
      'src/ledger-card/ledger-card.tsx': 'export const LedgerCard = 1;\n',
    });
    expect(() => buildRegistry(fixtureConfig(dir))).toThrow(
      'free item badge depends on pro item ledger-card',
    );
  });

  it('fails on a test file in an item', () => {
    const dir = fixture({ 'src/badge/badge.test.tsx': 'export {};\n' });
    const items = [fixtureItem({ name: 'badge', files: ['badge/badge.test.tsx'] })];
    expect(() =>
      buildRegistry({ ...fixtureConfig(dir, items), requireEveryFolder: false }),
    ).toThrow('is a test or story file');
  });

  it('writes the index, latest and versioned copies, pro bodies apart, and the schemas', () => {
    const dir = fixture();
    const out = join(dir, 'out');
    writeRegistry(out, buildRegistry(fixtureConfig(dir)));
    for (const path of [
      'index.json',
      'items/badge.json',
      'items/badge@1.0.0.json',
      'pro/items/ledger-card.json',
      'pro/items/ledger-card@2.1.0.json',
      'schema/item.json',
      'schema/index.json',
      'schema/config.json',
    ]) {
      expect(existsSync(join(out, path)), path).toBe(true);
    }
    expect(existsSync(join(out, 'items/ledger-card.json'))).toBe(false);
    const index = readFileSync(join(out, 'index.json'), 'utf8');
    expect(index).not.toContain('content');
  });
});

describe('the token split', () => {
  it('reads a font slug from a family list', () => {
    expect(fontSlug('"IBM Plex Sans Variable", "IBM Plex Sans", sans-serif')).toBe('ibm-plex-sans');
    expect(fontSlug('"Source Serif 4 Variable", serif')).toBe('source-serif-4');
    expect(fontSlug('ui-sans-serif, system-ui')).toBeUndefined();
  });

  it('splits nested blocks and keeps comments with them', () => {
    const blocks = splitBlocks(
      '/* a */\n:root {\n  --x: 1;\n}\n@media (y) {\n  b {\n    --z: 2;\n  }\n}\n',
    );
    expect(blocks.map((b) => [b.comment, b.prelude])).toEqual([
      ['/* a */', ':root'],
      ['', '@media (y)'],
    ]);
    expect(splitBlocks(blocks[1]?.body ?? '').map((b) => b.prelude)).toEqual(['b']);
  });
});

describe('the rectio registry', () => {
  const result = buildRegistry(config);
  const byName = new Map(result.items.map((i) => [i.name, i]));

  it('publishes every component, the tokens and one theme item per theme', () => {
    expect([...byName.keys()].sort()).toEqual([
      'amount-input',
      'button',
      'cn',
      'dialog',
      'field',
      'money',
      'select',
      'theme-default',
      'theme-ledger',
      'theme-scope',
      'tokens',
    ]);
  });

  it('derives the component graph from the imports', () => {
    expect(byName.get('dialog')?.registryDependencies).toEqual(['tokens', 'cn', 'theme-scope']);
    expect(byName.get('select')?.registryDependencies).toEqual([
      'tokens',
      'cn',
      'field',
      'theme-scope',
    ]);
    expect(byName.get('button')?.dependencies).toEqual({
      '@base-ui/react': '^1.9.0',
      '@phosphor-icons/react': '^2.1.10',
    });
    expect(byName.get('cn')?.dependencies).toEqual({ clsx: '^2.1.1', 'tailwind-merge': '^3.7.0' });
  });

  it('keeps no relative import in published code', () => {
    for (const item of result.items) {
      for (const file of item.files) {
        expect(file.content, file.path).not.toMatch(/from '\.\.?\//);
      }
    }
  });

  it('gives each theme its own selectors and fonts, and the base layer to tokens', () => {
    const ledger = byName.get('theme-ledger');
    const css = ledger?.files[0]?.content ?? '';
    expect(css).toContain('[data-theme="ledger"]');
    expect(css).not.toContain('[data-theme="default"]');
    expect(css).toContain("@import '@fontsource-variable/source-serif-4/opsz.css';");
    expect(ledger?.dependencies).toHaveProperty('@fontsource-variable/schibsted-grotesk');
    expect(ledger?.registryDependencies).toEqual(['tokens']);

    const defaults = byName.get('theme-default')?.files[0]?.content ?? '';
    expect(defaults).toContain(':root,\n[data-theme="default"] {');
    expect(defaults).not.toContain('schibsted');

    const tokens = byName.get('tokens')?.files[0]?.content ?? '';
    expect(tokens).toContain('@theme inline {');
    expect(tokens).toContain('[data-density="compact"]');
    expect(tokens).toContain('prefers-reduced-motion');
    expect(tokens).not.toContain("@import './themes.css'");
    expect(tokens).not.toContain('[data-theme="ledger"]');
  });
});

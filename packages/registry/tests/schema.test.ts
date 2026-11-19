import { describe, expect, it } from 'vitest';

import {
  canonicalJson,
  itemIntegrity,
  jsonSchemas,
  registryIndexSchema,
  registryItemSchema,
  sha256Hex,
  verifyItem,
  type RegistryItem,
} from '../src/index.ts';

const content = 'export const x = 1;\n';

function validItem(): RegistryItem {
  const body = {
    schemaVersion: 1 as const,
    name: 'button',
    version: '1.2.3',
    type: 'component' as const,
    tier: 'free' as const,
    title: 'Button',
    description: 'A button.',
    categories: [],
    dependencies: { '@base-ui/react': '^1.9.0' },
    devDependencies: {},
    registryDependencies: ['cn'],
    requires: {},
    files: [
      {
        path: 'ui/button.tsx',
        type: 'component' as const,
        target: '@ui/button.tsx',
        content,
        sha256: sha256Hex(content),
      },
    ],
  };
  return { ...body, integrity: itemIntegrity(body) };
}

describe('registryItemSchema', () => {
  it('accepts a complete item and fills defaults', () => {
    const minimal: Record<string, unknown> = { ...validItem() };
    delete minimal.categories;
    delete minimal.devDependencies;
    const parsed = registryItemSchema.parse(minimal);
    expect(parsed.categories).toEqual([]);
    expect(parsed.devDependencies).toEqual({});
  });

  it.each([
    ['a non kebab name', { name: 'Button' }],
    ['a bad version', { version: '1.2' }],
    ['an unknown type', { type: 'widget' }],
    ['an unknown tier', { tier: 'gold' }],
    ['no files', { files: [] }],
    ['a newer schema version', { schemaVersion: 2 }],
  ])('rejects %s', (_label, patch) => {
    expect(registryItemSchema.safeParse({ ...validItem(), ...patch }).success).toBe(false);
  });

  it.each(['../evil.ts', '/etc/passwd', 'ui/../../x.ts', 'C:/x.ts', 'ui\\x.ts', 'ui//x.ts'])(
    'rejects the unsafe file path %s',
    (path) => {
      const item = validItem();
      const file = { ...item.files[0], path };
      expect(registryItemSchema.safeParse({ ...item, files: [file] }).success).toBe(false);
    },
  );

  it.each(['ui/button.tsx', '@nope/button.tsx', '@ui/../x.tsx', '@ui/'])(
    'rejects the target %s',
    (target) => {
      const item = validItem();
      const file = { ...item.files[0], target };
      expect(registryItemSchema.safeParse({ ...item, files: [file] }).success).toBe(false);
    },
  );
});

describe('integrity', () => {
  it('verifies an intact item', () => {
    expect(verifyItem(validItem())).toEqual([]);
  });

  it('reports a changed file and a changed field', () => {
    const item = validItem();
    const tampered = {
      ...item,
      title: 'Other',
      files: item.files.map((f) => ({ ...f, content: 'evil' })),
    };
    const problems = verifyItem(tampered).map((p) => p.message);
    expect(problems).toContain('file content does not match its sha256');
    expect(problems).toContain('item integrity does not match its content');
  });

  it('ignores key order and $schema', () => {
    const item = validItem();
    const reordered = Object.fromEntries(Object.entries(item).reverse()) as RegistryItem;
    expect(itemIntegrity({ ...reordered, $schema: 'https://example.com' })).toBe(item.integrity);
  });

  it('serialises canonically', () => {
    expect(canonicalJson({ b: 1, a: { d: [2, { z: 1, y: 2 }], c: undefined } })).toBe(
      '{"a":{"d":[2,{"y":2,"z":1}]},"b":1}',
    );
  });
});

describe('published JSON Schema', () => {
  it('describes the item and the index', () => {
    const { item, index } = jsonSchemas() as {
      item: { properties: Record<string, unknown>; required: string[] };
      index: { properties: Record<string, unknown> };
    };
    expect(Object.keys(item.properties)).toEqual(
      expect.arrayContaining(['tier', 'version', 'files', 'registryDependencies', 'integrity']),
    );
    expect(item.required).toContain('integrity');
    expect(item.required).not.toContain('categories');
    expect(index.properties).toHaveProperty('items');
  });

  it('parses an index', () => {
    const parsed = registryIndexSchema.parse({
      schemaVersion: 1,
      name: 'rectio',
      items: [
        {
          name: 'x',
          type: 'lib',
          tier: 'pro',
          version: '1.0.0',
          versions: ['1.0.0'],
          title: 'X',
          description: 'X.',
        },
      ],
    });
    expect(parsed.items[0]?.registryDependencies).toEqual([]);
  });
});

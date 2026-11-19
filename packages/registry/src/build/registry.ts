import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { itemIntegrity, sha256Hex } from '../integrity.ts';
import {
  SCHEMA_VERSION,
  TOKEN_CONTRACT_VERSION,
  registryIndexSchema,
  registryItemSchema,
  type RegistryIndex,
  type RegistryItem,
} from '../schema.ts';
import type { RegistryConfig } from './config.ts';
import { buildSourceItems, readRanges, sortRecord, type BuiltFile } from './sources.ts';
import { splitTokens } from './themes.ts';

export const ITEM_SCHEMA_URL = 'https://rectio.dev/r/schema/item.json';
export const INDEX_SCHEMA_URL = 'https://rectio.dev/r/schema/index.json';
const TAILWIND_RANGE = '>=4.0.0';
const TOKENS_ITEM = 'tokens';

export interface BuildResult {
  index: RegistryIndex;
  items: RegistryItem[];
  warnings: string[];
}

type Draft = Omit<RegistryItem, 'integrity' | 'files'> & { files: BuiltFile[] };

/** Hashes every file and the item, then validates the result against the published schema. */
function finish(draft: Draft): RegistryItem {
  const files = draft.files.map((f) => ({ ...f, sha256: sha256Hex(f.content) }));
  const body = { ...draft, files };
  return registryItemSchema.parse({ ...body, integrity: itemIntegrity(body) });
}

function base(name: string, version: string) {
  return { $schema: ITEM_SCHEMA_URL, schemaVersion: SCHEMA_VERSION, name, version } as const;
}

function readPeerReact(packageJsons: readonly string[]): string | undefined {
  for (const file of packageJsons) {
    const pkg = JSON.parse(readFileSync(file, 'utf8')) as {
      peerDependencies?: Record<string, string>;
    };
    const range = pkg.peerDependencies?.react;
    if (range !== undefined) return range;
  }
  return undefined;
}

/** Turns the configured sources into validated registry items and the public index. */
export function buildRegistry(config: RegistryConfig): BuildResult {
  const ranges = readRanges(config.packageJsons);
  const reactRange = readPeerReact(config.packageJsons);
  const warnings: string[] = [];
  const items: RegistryItem[] = [];
  const hasTokens = config.tokens !== undefined;

  for (const built of buildSourceItems(
    config.sourceDir,
    config.items,
    ranges,
    config.requireEveryFolder ?? false,
  )) {
    const { config: item } = built;
    const styled = item.type === 'component' || item.type === 'block';
    const registryDependencies = [
      ...(styled && hasTokens ? [TOKENS_ITEM] : []),
      ...built.registryDependencies,
    ];
    items.push(
      finish({
        ...base(item.name, item.version),
        type: item.type,
        tier: item.tier,
        title: item.title,
        description: item.description,
        categories: item.categories ?? [],
        dependencies: built.dependencies,
        devDependencies: {},
        registryDependencies,
        requires: {
          ...(built.usesReact && reactRange !== undefined ? { react: reactRange } : {}),
          ...(styled ? { tailwindcss: TAILWIND_RANGE, tokenContract: TOKEN_CONTRACT_VERSION } : {}),
        },
        files: built.files,
        ...(item.cssVars === undefined ? {} : { cssVars: item.cssVars }),
        ...(item.docs === undefined ? {} : { docs: item.docs }),
        ...(item.meta === undefined ? {} : { meta: item.meta }),
      }),
    );
  }

  if (config.tokens !== undefined) {
    const { dir, item, themes } = config.tokens;
    const split = splitTokens(dir);
    warnings.push(...split.warnings);
    const tokenRanges = readRanges([join(dir, 'package.json')]);
    const defaultTheme = themes.find((t) => t.id === 'default');
    if (defaultTheme === undefined) throw new Error('the tokens need a "default" theme item');

    items.push(
      finish({
        ...base(TOKENS_ITEM, item.version),
        type: 'style',
        tier: 'free',
        title: item.title,
        description: item.description,
        categories: ['tokens'],
        dependencies: {},
        devDependencies: {},
        // The default theme also fills :root, the fallback every other theme builds on.
        registryDependencies: [`theme-${defaultTheme.id}`],
        requires: { tailwindcss: TAILWIND_RANGE, tokenContract: TOKEN_CONTRACT_VERSION },
        files: [
          {
            path: 'styles/tokens.css',
            type: 'style',
            target: '@styles/tokens.css',
            content: split.tokensCss,
          },
        ],
      }),
    );

    for (const id of split.themes.keys()) {
      if (!themes.some((t) => t.id === id)) {
        throw new Error(`theme "${id}" from @rectio/tokens has no registry config`);
      }
    }
    for (const theme of themes) {
      const css = split.themes.get(theme.id);
      if (css === undefined) throw new Error(`theme "${theme.id}" is not in @rectio/tokens`);
      const dependencies: Record<string, string> = {};
      for (const pkg of css.fontPackages) {
        const range = tokenRanges.get(pkg);
        if (range === undefined) throw new Error(`font package ${pkg} is not in the tokens deps`);
        dependencies[pkg] = range;
      }
      items.push(
        finish({
          ...base(`theme-${theme.id}`, theme.version),
          type: 'theme',
          tier: theme.tier,
          title: theme.title,
          description: theme.description,
          categories: ['theme'],
          dependencies: sortRecord(dependencies),
          devDependencies: {},
          registryDependencies: theme.id === defaultTheme.id ? [] : [TOKENS_ITEM],
          requires: { tokenContract: TOKEN_CONTRACT_VERSION },
          files: [
            {
              path: `styles/themes/${theme.id}.css`,
              type: 'theme',
              target: `@styles/themes/${theme.id}.css`,
              content: css.css,
            },
          ],
          theme: { id: theme.id, modes: ['light', 'dark'], densities: ['comfortable', 'compact'] },
          docs:
            theme.id === defaultTheme.id
              ? undefined
              : `Set data-theme="${theme.id}" on <html> (or wrap a subtree in ThemeScope) to use it.`,
        }),
      );
    }
  }

  checkGraph(items);
  items.sort((a, b) => (a.name < b.name ? -1 : 1));
  const index = registryIndexSchema.parse({
    $schema: INDEX_SCHEMA_URL,
    schemaVersion: SCHEMA_VERSION,
    name: config.name,
    ...(config.homepage === undefined ? {} : { homepage: config.homepage }),
    items: items.map((item) => ({
      name: item.name,
      type: item.type,
      tier: item.tier,
      version: item.version,
      versions: [item.version],
      title: item.title,
      description: item.description,
      categories: item.categories,
      registryDependencies: item.registryDependencies,
    })),
  });
  return { index, items, warnings };
}

/** Unique names, known dependencies, and no free item that pulls in a pro one. */
function checkGraph(items: readonly RegistryItem[]): void {
  const problems: string[] = [];
  const byName = new Map<string, RegistryItem>();
  for (const item of items) {
    if (byName.has(item.name)) problems.push(`duplicate item name "${item.name}"`);
    byName.set(item.name, item);
  }
  for (const item of items) {
    for (const dep of item.registryDependencies) {
      const target = byName.get(dep);
      if (target === undefined) problems.push(`${item.name} depends on unknown item "${dep}"`);
      else if (item.tier === 'free' && target.tier === 'pro') {
        problems.push(`free item ${item.name} depends on pro item ${dep}`);
      }
    }
  }
  if (problems.length > 0) throw new Error(`registry graph:\n  ${problems.join('\n  ')}`);
}

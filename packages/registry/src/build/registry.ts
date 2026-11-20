import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { itemIntegrity, sha256Hex } from '../integrity.ts';
import { SCHEMA_PATHS } from '../layout.ts';
import {
  SCHEMA_VERSION,
  TEMPLATE_ALIAS_DIRS,
  TOKEN_CONTRACT_VERSION,
  registryIndexSchema,
  registryItemSchema,
  type AliasKey,
  type RegistryIndex,
  type RegistryItem,
} from '../schema.ts';
import { REGISTRY_URL } from '../site.ts';
import type { RegistryConfig } from './config.ts';
import { buildSourceItems, readRanges, sortRecord, type BuiltFile } from './sources.ts';
import { buildTemplate, findTemplates } from './templates.ts';
import { splitTokens } from './themes.ts';

export const ITEM_SCHEMA_URL = `${REGISTRY_URL}/${SCHEMA_PATHS.item}`;
export const INDEX_SCHEMA_URL = `${REGISTRY_URL}/${SCHEMA_PATHS.index}`;
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

  const roots = [
    {
      sourceDir: config.sourceDir,
      items: config.items,
      requireEveryFolder: config.requireEveryFolder ?? false,
    },
    ...(config.addons ?? []).map((addon) => ({
      sourceDir: addon.sourceDir,
      items: addon.items,
      requireEveryFolder: addon.requireEveryFolder ?? false,
      targetFolder: addon.targetFolder,
    })),
  ];
  for (const built of buildSourceItems(roots, ranges, config.workspacePackages)) {
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

  // Templates last: they rest on every kit item, and must not collide with any kit file.
  const themeIds = config.tokens?.themes.map((theme) => `theme-${theme.id}`) ?? [];
  const kitPaths = new Set(
    items.flatMap((item) => [
      ...item.files.map((file) => {
        const slash = file.target.indexOf('/');
        const key = file.target.slice(1, slash) as AliasKey;
        return `${TEMPLATE_ALIAS_DIRS[key]}/${file.target.slice(slash + 1)}`;
      }),
      ...(item.cssVars === undefined
        ? []
        : [`${TEMPLATE_ALIAS_DIRS.styles}/vars/${item.name}.css`]),
    ]),
  );
  for (const folder of findTemplates(config.templates?.dir ?? '')) {
    const built = buildTemplate(folder, roots, config.workspacePackages ?? {}, kitPaths);
    const { manifest } = built;
    items.push(
      finish({
        ...base(manifest.name, built.version),
        type: 'template',
        title: manifest.title,
        description: manifest.description,
        categories: ['template', manifest.category],
        // The template's own package.json carries its npm packages; the kit items bring theirs.
        dependencies: {},
        devDependencies: {},
        // A template switches theme at runtime, so it installs the tokens and every theme.
        registryDependencies: [
          ...new Set([...(hasTokens ? [TOKENS_ITEM, ...themeIds] : []), ...built.uses]),
        ].sort(),
        requires: {
          ...(built.reactRange === undefined ? {} : { react: built.reactRange }),
          tailwindcss: TAILWIND_RANGE,
          ...(hasTokens ? { tokenContract: TOKEN_CONTRACT_VERSION } : {}),
        },
        files: built.files,
        template: {
          category: manifest.category,
          framework: 'next',
          pages: manifest.pages,
          uses: built.uses,
          screenshots: manifest.screenshots,
        },
        docs: `Run the app with your package manager's dev script. Pages: ${manifest.pages.join(', ')}.`,
      }),
    );
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

/** Unique names and known dependencies. */
function checkGraph(items: readonly RegistryItem[]): void {
  const problems: string[] = [];
  const names = new Set<string>();
  for (const item of items) {
    if (names.has(item.name)) problems.push(`duplicate item name "${item.name}"`);
    names.add(item.name);
  }
  for (const item of items) {
    for (const dep of item.registryDependencies) {
      if (!names.has(dep)) problems.push(`${item.name} depends on unknown item "${dep}"`);
    }
  }
  if (problems.length > 0) throw new Error(`registry graph:\n  ${problems.join('\n  ')}`);
}

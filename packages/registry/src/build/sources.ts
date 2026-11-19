import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, relative, resolve, sep } from 'node:path';

import { normalizeLineEndings } from '../integrity.ts';
import { REGISTRY_IMPORT_PREFIX, type AliasKey, type FileType } from '../schema.ts';
import type { SourceItemConfig, SourceItemType } from './config.ts';
import {
  findImports,
  isRelative,
  packageName,
  reactValueImports,
  replaceImports,
} from './imports.ts';

const ALIAS_FOR: Record<SourceItemType, AliasKey> = {
  component: 'ui',
  block: 'blocks',
  lib: 'lib',
  hook: 'hooks',
};

/** Packages React itself provides; items declare them in `requires`, never as dependencies. */
const REACT_PACKAGES = new Set(['react', 'react-dom']);
/** Packages that never make a module a client module on their own. */
const NEUTRAL_PACKAGES = new Set(['react', 'react-dom', 'clsx', 'tailwind-merge']);
const CLIENT_REACT_NAMES = /^(use[A-Z]\w*|use|createContext)$/;
const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '/index.ts', '/index.tsx'];
const TEST_FILE = /\.(test|spec|stories)\.[cm]?[jt]sx?$/;

export interface BuiltFile {
  path: string;
  type: FileType;
  target: string;
  content: string;
}

export interface BuiltSourceItem {
  config: SourceItemConfig;
  files: BuiltFile[];
  dependencies: Record<string, string>;
  registryDependencies: string[];
  usesReact: boolean;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export function readRanges(packageJsons: readonly string[]): Map<string, string> {
  const ranges = new Map<string, string>();
  for (const file of packageJsons) {
    const pkg = JSON.parse(readFileSync(file, 'utf8')) as PackageJson;
    for (const deps of [pkg.dependencies, pkg.peerDependencies]) {
      for (const [name, range] of Object.entries(deps ?? {})) {
        if (!ranges.has(name) && !range.startsWith('workspace:')) ranges.set(name, range);
      }
    }
  }
  return ranges;
}

/** Registry path of a source file: alias key plus base name, `button/button.tsx` -> `ui/button.tsx`. */
function registryPath(type: SourceItemType, file: string): string {
  return `${ALIAS_FOR[type]}/${basename(file)}`;
}

const stripExtension = (path: string) => path.slice(0, path.length - extname(path).length);
const toPosix = (path: string) => path.split(sep).join('/');

function resolveRelative(fromFile: string, specifier: string): string | undefined {
  const base = resolve(dirname(fromFile), specifier);
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const extension of RESOLVE_EXTENSIONS) {
    const candidate = base + extension;
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Reads each item's files, maps relative imports to registry imports (`@registry/ui/field`) and
 * derives npm and registry dependencies from the imports. Throws with every problem at once.
 */
export function buildSourceItems(
  sourceDir: string,
  items: readonly SourceItemConfig[],
  ranges: ReadonlyMap<string, string>,
  requireEveryFolder: boolean,
): BuiltSourceItem[] {
  const problems: string[] = [];
  const owner = new Map<string, { item: SourceItemConfig; path: string }>();
  const targets = new Map<string, string>();

  for (const item of items) {
    for (const file of item.files) {
      const absolute = resolve(sourceDir, file);
      if (TEST_FILE.test(file)) problems.push(`${item.name}: ${file} is a test or story file`);
      if (!existsSync(absolute)) problems.push(`${item.name}: ${file} does not exist`);
      const previous = owner.get(absolute);
      if (previous !== undefined) {
        problems.push(`${file} is listed by both "${previous.item.name}" and "${item.name}"`);
      }
      const path = registryPath(item.type, file);
      const clash = targets.get(path);
      if (clash !== undefined)
        problems.push(`${item.name}: ${file} and ${clash} both map to ${path}`);
      targets.set(path, file);
      owner.set(absolute, { item, path });
    }
  }

  if (requireEveryFolder) {
    const listedFolders = new Set(
      [...owner.keys()].map((file) => toPosix(relative(sourceDir, file)).split('/')[0]),
    );
    for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
      if (entry.isDirectory() && !listedFolders.has(entry.name)) {
        problems.push(`folder ${entry.name}/ belongs to no registry item: add it to the config`);
      }
    }
  }
  if (problems.length > 0) throw new Error(`registry sources:\n  ${problems.join('\n  ')}`);

  const built = items.map((item) => {
    const dependencies: Record<string, string> = {};
    const registryDependencies = new Set<string>();
    let usesReact = false;
    const files = item.files.map((file): BuiltFile => {
      const absolute = resolve(sourceDir, file);
      const source = normalizeLineEndings(readFileSync(absolute, 'utf8'));
      const sites = findImports(source);
      let client = false;
      const content = replaceImports(source, sites, (specifier) => {
        if (isRelative(specifier)) {
          const target = resolveRelative(absolute, specifier);
          const hit = target === undefined ? undefined : owner.get(target);
          if (hit === undefined) {
            problems.push(`${item.name}: ${file} imports ${specifier}, which is in no item`);
            return specifier;
          }
          if (hit.item.name !== item.name) registryDependencies.add(hit.item.name);
          return REGISTRY_IMPORT_PREFIX + stripExtension(hit.path);
        }
        if (specifier.startsWith('node:')) {
          problems.push(
            `${item.name}: ${file} imports ${specifier}; registry code runs in the browser`,
          );
          return specifier;
        }
        const pkg = packageName(specifier);
        if (!NEUTRAL_PACKAGES.has(pkg)) client = true;
        if (REACT_PACKAGES.has(pkg)) {
          usesReact = true;
          return specifier;
        }
        const range = ranges.get(pkg);
        if (range === undefined) {
          problems.push(`${item.name}: ${file} imports ${pkg}, which no package.json declares`);
        } else {
          dependencies[pkg] = range;
        }
        return specifier;
      });
      if (reactValueImports(source).some((name) => CLIENT_REACT_NAMES.test(name))) client = true;
      const isTsx = file.endsWith('.tsx');
      const wantsClient = isTsx && (item.client ?? client);
      const hasDirective = /^\s*['"]use client['"]/.test(content);
      const path = registryPath(item.type, file);
      return {
        path,
        type: item.type,
        target: `@${path}`,
        content: wantsClient && !hasDirective ? `'use client';\n\n${content}` : content,
      };
    });
    return {
      config: item,
      files,
      dependencies: sortRecord(dependencies),
      registryDependencies: [...registryDependencies].sort(),
      usesReact,
    };
  });

  if (problems.length > 0) throw new Error(`registry imports:\n  ${problems.join('\n  ')}`);
  return built;
}

export function sortRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => (a < b ? -1 : 1)));
}

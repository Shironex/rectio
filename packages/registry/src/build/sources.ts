import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, relative, resolve, sep } from 'node:path';

import ts from 'typescript';

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

/** One source tree: the base package, or an add-on that installs into its own folder. */
export interface SourceRoot {
  sourceDir: string;
  items: readonly SourceItemConfig[];
  requireEveryFolder: boolean;
  /** Folder under the alias, for an add-on: `motion` -> `ui/motion/button.tsx`. */
  targetFolder?: string | undefined;
}

/**
 * Registry path of a source file: alias key, the tree's folder if any, and the base name:
 * `button/button.tsx` -> `ui/button.tsx`, or `ui/motion/button.tsx` in the motion tree.
 */
export function registryPath(type: SourceItemType, file: string, folder?: string): string {
  return [ALIAS_FOR[type], folder, basename(file)].filter((part) => part !== undefined).join('/');
}

/** Names a module declares and exports itself: `export function X`, `export const Y`, ... */
function ownExports(source: ts.SourceFile): string[] {
  const names: string[] = [];
  for (const statement of source.statements) {
    const exported = ts.canHaveModifiers(statement)
      ? ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) === true
      : false;
    if (!exported) continue;
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.push(declaration.name.text);
      }
    } else if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      statement.name !== undefined
    ) {
      names.push(statement.name.text);
    }
  }
  return names;
}

/**
 * Which source file each name of a barrel (a package's index.ts) comes from. Follows named
 * re-exports and `export *`, through nested barrels, to the file that declares the name.
 */
export function readBarrel(file: string, seen = new Set<string>()): Map<string, string> {
  const names = new Map<string, string>();
  if (seen.has(file)) return names;
  seen.add(file);
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest);
  for (const name of ownExports(source)) names.set(name, file);
  for (const statement of source.statements) {
    if (!ts.isExportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier;
    const clause = statement.exportClause;
    if (specifier === undefined || !ts.isStringLiteral(specifier)) continue;
    if (!isRelative(specifier.text)) continue;
    const target = resolveRelative(file, specifier.text);
    if (target === undefined) continue;
    if (clause === undefined) {
      for (const [name, from] of readBarrel(target, seen)) names.set(name, from);
    } else if (ts.isNamedExports(clause)) {
      for (const element of clause.elements) names.set(element.name.text, target);
    }
  }
  return names;
}

/**
 * Splits each import of a workspace package into one registry import per owning item:
 * `import { Dialog, cn } from '@rectio/ui'` becomes imports from `@registry/ui/dialog` and
 * `@registry/lib/cn`. Returns the new source and the items it now depends on.
 */
export function rewriteWorkspaceImports(
  file: string,
  source: string,
  barrels: ReadonlyMap<string, ReadonlyMap<string, string>>,
  owner: ReadonlyMap<string, { item: SourceItemConfig; path: string }>,
  problems: string[],
): { source: string; items: string[] } {
  if (barrels.size === 0) return { source, items: [] };
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits: { start: number; end: number; text: string }[] = [];
  const items = new Set<string>();
  for (const statement of tree.statements) {
    // `import { A } from 'pkg'` and the re-export `export { A } from 'pkg'` both name items.
    const isImport = ts.isImportDeclaration(statement);
    if (!isImport && !ts.isExportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier;
    if (specifier === undefined || !ts.isStringLiteral(specifier)) continue;
    const pkg = specifier.text;
    const barrel = barrels.get(pkg);
    if (barrel === undefined) continue;
    let elements: ts.NodeArray<ts.ImportSpecifier | ts.ExportSpecifier>;
    let typeOnly: boolean;
    if (isImport) {
      const clause = statement.importClause;
      const named = clause?.namedBindings;
      if (
        clause === undefined ||
        clause.name !== undefined ||
        named === undefined ||
        !ts.isNamedImports(named)
      ) {
        problems.push(`${file}: import only named exports from ${pkg}`);
        continue;
      }
      elements = named.elements;
      typeOnly = clause.phaseModifier === ts.SyntaxKind.TypeKeyword;
    } else {
      const clause = statement.exportClause;
      if (clause === undefined || !ts.isNamedExports(clause)) {
        problems.push(`${file}: re-export only named exports from ${pkg}`);
        continue;
      }
      elements = clause.elements;
      typeOnly = statement.isTypeOnly;
    }
    const groups = new Map<string, string[]>();
    for (const element of elements) {
      const name = (element.propertyName ?? element.name).text;
      const target = barrel.get(name);
      const hit = target === undefined ? undefined : owner.get(target);
      if (hit === undefined) {
        problems.push(`${file}: ${pkg} exports ${name} from no registry item`);
        continue;
      }
      items.add(hit.item.name);
      const path = REGISTRY_IMPORT_PREFIX + stripExtension(hit.path);
      groups.set(path, [...(groups.get(path) ?? []), element.getText(tree)]);
    }
    const keyword = `${isImport ? 'import' : 'export'}${typeOnly ? ' type' : ''}`;
    const text = [...groups]
      .map(([path, names]) => `${keyword} { ${names.join(', ')} } from '${path}';`)
      .join('\n');
    edits.push({ start: statement.getStart(tree), end: statement.end, text });
  }
  let out = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  }
  return { source: out, items: [...items] };
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
  roots: readonly SourceRoot[],
  ranges: ReadonlyMap<string, string>,
  workspacePackages: Readonly<Record<string, string>> = {},
): BuiltSourceItem[] {
  const problems: string[] = [];
  const owner = new Map<string, { item: SourceItemConfig; path: string }>();
  const targets = new Map<string, string>();
  const rootOf = new Map<SourceItemConfig, SourceRoot>();

  for (const root of roots) {
    for (const item of root.items) rootOf.set(item, root);
  }
  for (const [item, { sourceDir, targetFolder }] of rootOf) {
    for (const file of item.files) {
      const absolute = resolve(sourceDir, file);
      if (TEST_FILE.test(file)) problems.push(`${item.name}: ${file} is a test or story file`);
      if (!existsSync(absolute)) problems.push(`${item.name}: ${file} does not exist`);
      const previous = owner.get(absolute);
      if (previous !== undefined) {
        problems.push(`${file} is listed by both "${previous.item.name}" and "${item.name}"`);
      }
      const path = registryPath(item.type, file, targetFolder);
      const clash = targets.get(path);
      if (clash !== undefined)
        problems.push(`${item.name}: ${file} and ${clash} both map to ${path}`);
      targets.set(path, file);
      owner.set(absolute, { item, path });
    }
  }

  for (const { sourceDir, requireEveryFolder } of roots) {
    if (!requireEveryFolder) continue;
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

  const barrels = new Map(
    Object.entries(workspacePackages).map(([pkg, barrel]) => [pkg, readBarrel(barrel)] as const),
  );
  const built = [...rootOf].map(([item, { sourceDir, targetFolder }]) => {
    const dependencies: Record<string, string> = {};
    const registryDependencies = new Set<string>();
    let usesReact = false;
    const files = item.files.map((file): BuiltFile => {
      const absolute = resolve(sourceDir, file);
      const workspace = rewriteWorkspaceImports(
        file,
        normalizeLineEndings(readFileSync(absolute, 'utf8')),
        barrels,
        owner,
        problems,
      );
      const source = workspace.source;
      for (const name of workspace.items) registryDependencies.add(name);
      const sites = findImports(source);
      // A component of the base package makes a file a client module, as the package did.
      let client = workspace.items.length > 0;
      const content = replaceImports(source, sites, (specifier) => {
        if (specifier.startsWith(REGISTRY_IMPORT_PREFIX)) return specifier;
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
      const path = registryPath(item.type, file, targetFolder);
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

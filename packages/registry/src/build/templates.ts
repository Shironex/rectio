import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

import { normalizeLineEndings } from '../integrity.ts';
import { PROJECT_PLACEHOLDER, REGISTRY_IMPORT_PREFIX } from '../schema.ts';
import { templateManifestSchema, type TemplateManifest } from '../template-manifest.ts';
import type { SourceItemConfig } from './config.ts';
import { findImports, isRelative, packageName } from './imports.ts';
import {
  readBarrel,
  registryPath,
  rewriteWorkspaceImports,
  type BuiltFile,
  type SourceRoot,
} from './sources.ts';

export const TEMPLATE_MANIFEST = 'template.json';

/** Folders that are build output or repo tooling, never part of the project a buyer gets. */
const SKIP_DIRS = new Set(['node_modules', '.next', 'out', '.turbo', 'screenshots', 'scripts']);
/** Repo-only files at the template root: its manifest and its Turborepo task config. */
const SKIP_ROOT_FILES = new Set([TEMPLATE_MANIFEST, 'turbo.json', 'next-env.d.ts']);
/** Text files a template ships. Images and fonts stay in the repo (screenshots are for the site). */
const SHIPPED = /\.(?:tsx?|mts|mjs|cjs|jsx?|css|json|md|mdx|txt)$|^\.gitignore$/;
const SCRIPT = /\.(?:tsx?|mts|mjs|cjs|jsx?)$/;
/**
 * Folders that belong to the kit in the new project. `lib/` and `hooks/` are shared: a template may
 * keep its own helpers there, as long as no kit file has the same path (`kitPaths`).
 */
const RESERVED = ['components/ui/', 'components/blocks/', 'styles/rectio/'];
/** A line that only works inside the rectio repo ends with this marker; the build drops it. */
const WORKSPACE_LINE = /^.*(?:\/\/\s*rectio:workspace|\/\*\s*rectio:workspace\s*\*\/)\s*$\n?/gm;
/** package.json fields that only serve the repo: its screenshot script and the root lint. */
const REPO_SCRIPTS = ['shoot', 'lint'];
const REPO_DEV_DEPENDENCIES = ['playwright'];

interface TemplatePackageJson {
  name?: string;
  version?: string;
  license?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [field: string]: unknown;
}

export interface BuiltTemplate {
  manifest: TemplateManifest;
  version: string;
  reactRange: string | undefined;
  files: BuiltFile[];
  /** Registry items the template imports directly, sorted. */
  uses: string[];
}

const toPosix = (path: string) => path.split(sep).join('/');

function listFiles(root: string, dir = root): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) files.push(...listFiles(root, path));
      continue;
    }
    const rel = toPosix(relative(root, path));
    if (dir === root && SKIP_ROOT_FILES.has(entry.name)) continue;
    if (entry.name.endsWith('.tsbuildinfo')) continue;
    if (SHIPPED.test(entry.name)) files.push(rel);
  }
  return files.sort();
}

/**
 * The template's package.json as the buyer gets it: the workspace packages are gone (their code
 * arrives as registry items, with their own npm dependencies), and so are the repo-only scripts.
 */
function projectPackageJson(text: string, manifest: TemplateManifest): string {
  const pkg = JSON.parse(text) as TemplatePackageJson;
  const out: TemplatePackageJson = { ...pkg, name: manifest.name };
  delete out.license;
  const strip = (deps: Record<string, string> | undefined, drop: readonly string[] = []) =>
    deps === undefined
      ? undefined
      : Object.fromEntries(
          Object.entries(deps).filter(
            ([name, range]) => !range.startsWith('workspace:') && !drop.includes(name),
          ),
        );
  if (pkg.scripts !== undefined) {
    out.scripts = Object.fromEntries(
      Object.entries(pkg.scripts).filter(([name]) => !REPO_SCRIPTS.includes(name)),
    );
  }
  const dependencies = strip(pkg.dependencies);
  const devDependencies = strip(pkg.devDependencies, REPO_DEV_DEPENDENCIES);
  if (dependencies !== undefined) out.dependencies = dependencies;
  if (devDependencies !== undefined) out.devDependencies = devDependencies;
  return `${JSON.stringify(out, null, 2)}\n`;
}

/** Every folder under `dir` that holds a template.json. */
export function findTemplates(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(dir, entry.name, TEMPLATE_MANIFEST)))
    .map((entry) => join(dir, entry.name))
    .sort();
}

export function readTemplateManifest(folder: string): TemplateManifest {
  const file = join(folder, TEMPLATE_MANIFEST);
  const parsed = templateManifestSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`${file} is invalid:\n  ${issues.join('\n  ')}`);
  }
  return parsed.data;
}

/**
 * Turns one template folder into the files of a template item. Workspace imports become registry
 * imports (`@rectio/ui` -> `@registry/ui/button`), which the CLI rewrites to the new project's
 * aliases; workspace-only lines are dropped. Throws with every problem at once.
 */
export function buildTemplate(
  folder: string,
  roots: readonly SourceRoot[],
  workspacePackages: Readonly<Record<string, string>>,
  /** Project paths kit items write to (`lib/cn.ts`, ...): a template file there would collide. */
  kitPaths: ReadonlySet<string> = new Set(),
): BuiltTemplate {
  const problems: string[] = [];
  const manifest = readTemplateManifest(folder);
  const label = `template ${manifest.name}`;
  if (toPosix(folder).split('/').at(-1) !== manifest.name) {
    problems.push(`${label}: the folder name must be "${manifest.name}"`);
  }
  for (const shot of manifest.screenshots) {
    if (!existsSync(join(folder, shot))) problems.push(`${label}: ${shot} does not exist`);
  }

  const owner = new Map<string, { item: SourceItemConfig; path: string }>();
  for (const root of roots) {
    for (const item of root.items) {
      for (const file of item.files) {
        owner.set(resolve(root.sourceDir, file), {
          item,
          path: registryPath(item.type, file, root.targetFolder),
        });
      }
    }
  }
  const barrels = new Map(
    Object.entries(workspacePackages).map(([pkg, barrel]) => [pkg, readBarrel(barrel)] as const),
  );
  // `@rectio/ui` -> `@rectio/`: no shipped file may still name a workspace package.
  const scopes = [...new Set(Object.keys(workspacePackages).map((pkg) => `${pkg.split('/')[0]}/`))];

  const pkgText = readFileSync(join(folder, 'package.json'), 'utf8');
  const pkg = JSON.parse(pkgText) as TemplatePackageJson;
  const declared = new Set(
    Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })
      .filter(([, range]) => !range.startsWith('workspace:'))
      .map(([name]) => name),
  );

  const uses = new Set<string>();
  const files: BuiltFile[] = [];
  for (const rel of listFiles(folder)) {
    if (RESERVED.some((prefix) => rel.startsWith(prefix))) {
      problems.push(`${label}: ${rel} sits where kit items install (${RESERVED.join(', ')})`);
      continue;
    }
    if (kitPaths.has(rel)) {
      problems.push(`${label}: ${rel} is also the path of a kit file; rename or move it`);
      continue;
    }
    let content = normalizeLineEndings(readFileSync(join(folder, rel), 'utf8'));
    if (rel === 'package.json') {
      content = projectPackageJson(content, manifest);
    } else {
      content = content.replace(WORKSPACE_LINE, '');
      if (SCRIPT.test(rel)) {
        const workspace = rewriteWorkspaceImports(rel, content, barrels, owner, problems);
        content = workspace.source;
        for (const name of workspace.items) uses.add(name);
        for (const { specifier } of findImports(content)) {
          if (
            specifier.startsWith(REGISTRY_IMPORT_PREFIX) ||
            specifier.startsWith('@/') ||
            specifier.startsWith('node:') ||
            isRelative(specifier)
          ) {
            continue;
          }
          const name = packageName(specifier);
          if (!declared.has(name)) {
            problems.push(
              `${label}: ${rel} imports ${name}, which its package.json does not declare`,
            );
          }
        }
      }
    }
    if (scopes.some((scope) => content.includes(scope)) || content.includes('workspace:')) {
      problems.push(
        `${label}: ${rel} still names a workspace package; mark the line with rectio:workspace`,
      );
    }
    files.push({
      path: `template/${rel}`,
      type: 'template',
      target: `@${PROJECT_PLACEHOLDER}/${rel}`,
      content,
    });
  }

  const derived = [...uses].sort();
  const listed = [...new Set(manifest.uses)].sort();
  const missing = derived.filter((name) => !listed.includes(name));
  const extra = listed.filter((name) => !derived.includes(name));
  if (missing.length > 0) {
    problems.push(`${label}: template.json "uses" is missing ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    problems.push(
      `${label}: template.json "uses" lists ${extra.join(', ')}, which it never imports`,
    );
  }
  if (!files.some((file) => file.path === 'template/package.json')) {
    problems.push(`${label}: no package.json`);
  }
  if (problems.length > 0) throw new Error(`registry templates:\n  ${problems.join('\n  ')}`);

  return {
    manifest,
    version: pkg.version ?? '0.1.0',
    reactRange: pkg.dependencies?.react,
    files,
    uses: derived,
  };
}

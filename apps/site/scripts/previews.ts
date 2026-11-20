/**
 * Live template previews: every templates/<name> with a template.json, built as its real static app
 * under the base path /preview/<name> (behind the site's own base path, SITE_BASE_PATH, so on
 * GitHub Pages it is /rectio/preview/<name>), so the site can serve it whole and the viewer can frame it.
 *
 *   node scripts/previews.ts build   build every template into apps/site/.previews/<name>/
 *   node scripts/previews.ts copy    copy .previews/* into out/preview/ (builds what is missing)
 *   node scripts/previews.ts missing build only the templates with no preview yet (`pnpm dev`)
 *
 * Each build records the base path it was made for, and `copy` and `missing` rebuild a preview made
 * for another one, so a local build never ships into a Pages build or the other way round.
 *
 * Turborepo runs `build` as the site's `previews` task (cached on the templates and the kit), and the
 * site build runs `copy` after `next build`. A template reads the base path from one line in its
 * next.config, `basePath: process.env.PREVIEW_BASE_PATH ?? ''`, marked `rectio:workspace` so the
 * registry drops it from the copy a buyer installs; without the variable it builds as before.
 *
 * Each template builds in a scratch copy (.preview-builds/<name> at the repo root, the same depth as
 * templates/, sharing the template's node_modules), so its own .next and out/ are never touched and
 * the template's own build can run at the same time. Every page is marked noindex and keeps its
 * links inside the preview (`prepareHtml` in lib/previews.ts).
 */
import { spawn } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { availableParallelism } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TEMPLATES_DIR, readTemplates } from '../lib/templates.ts';
import { PREVIEWS_DIR, prepareHtml, previewBase } from '../lib/previews.ts';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(site, '..', '..');
const WORK = join(root, '.preview-builds');
/** Never copied into the scratch build: installs, build output and repo-only folders. */
const SKIP = new Set(['node_modules', '.next', 'out', '.turbo', 'screenshots', 'scripts']);

function run(cwd: string, args: string[], env: NodeJS.ProcessEnv): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    child.stdout.on('data', (chunk: Buffer) => (log += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (log += chunk.toString()));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(log);
      else reject(new Error(`${args.join(' ')} in ${cwd} exited with ${String(code)}\n${log}`));
    });
  });
}

/** The template's source in its scratch folder; the build cache in .next stays between runs. */
function stage(name: string): string {
  const source = join(TEMPLATES_DIR, name);
  const work = join(WORK, name);
  mkdirSync(work, { recursive: true });
  for (const entry of readdirSync(work)) {
    if (entry !== 'node_modules' && entry !== '.next') {
      rmSync(join(work, entry), { recursive: true, force: true });
    }
  }
  for (const entry of readdirSync(source)) {
    if (SKIP.has(entry)) continue;
    cpSync(join(source, entry), join(work, entry), { recursive: true });
  }
  if (!existsSync(join(work, 'node_modules'))) {
    // A junction needs no rights on Windows and is a plain directory link elsewhere.
    symlinkSync(join(source, 'node_modules'), join(work, 'node_modules'), 'junction');
  }
  return work;
}

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => join(entry.parentPath, entry.name));
}

/** Written beside each preview: the base path it was built under. Never copied into out/. */
const BUILT_FOR = '.rectio-preview-base';

const builtFor = (name: string) => {
  const file = join(PREVIEWS_DIR, name, BUILT_FOR);
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
};

async function buildOne(name: string): Promise<void> {
  const started = Date.now();
  const work = stage(name);
  const next = join(work, 'node_modules', 'next', 'dist', 'bin', 'next');
  await run(work, [next, 'build'], {
    ...process.env,
    PREVIEW_BASE_PATH: previewBase(name),
    NEXT_TELEMETRY_DISABLED: '1',
  });
  const target = join(PREVIEWS_DIR, name);
  rmSync(target, { recursive: true, force: true });
  cpSync(join(work, 'out'), target, { recursive: true });
  for (const file of htmlFiles(target)) {
    writeFileSync(file, prepareHtml(readFileSync(file, 'utf8'), previewBase(name)));
  }
  writeFileSync(join(target, BUILT_FOR), previewBase(name));
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`previews: ${name} built under ${previewBase(name)} in ${seconds}s`);
}

/** Builds the templates two or more at a time: each next build is already multi-threaded. */
async function buildAll(names: string[]): Promise<void> {
  const width = Math.max(1, Math.min(names.length, Math.floor(availableParallelism() / 4)));
  const queue = [...names];
  await Promise.all(
    Array.from({ length: width }, async () => {
      for (let name = queue.shift(); name !== undefined; name = queue.shift()) {
        await buildOne(name);
      }
    }),
  );
}

const names = readTemplates().map((t) => t.name);
const mode = process.argv[2];
/** No preview yet, or one built under another base path. */
const missing = () =>
  names.filter(
    (name) =>
      !existsSync(join(PREVIEWS_DIR, name, 'index.html')) || builtFor(name) !== previewBase(name),
  );

if (mode === 'build') {
  // A template that is gone leaves no stale preview behind.
  if (existsSync(PREVIEWS_DIR)) {
    for (const entry of readdirSync(PREVIEWS_DIR)) {
      if (!names.includes(entry)) rmSync(join(PREVIEWS_DIR, entry), { recursive: true });
    }
  }
  await buildAll(names);
} else if (mode === 'missing') {
  // The dev server serves whatever is in .previews: a first run builds it, later runs start at once.
  const todo = missing();
  if (todo.length > 0) {
    console.log(
      `previews: building ${todo.join(', ')} for the live previews (a first build takes a minute or two)`,
    );
    await buildAll(todo);
  }
  console.log(
    'previews: serving the builds in .previews; after editing a template or the kit, run `pnpm previews` to rebuild them',
  );
} else if (mode === 'copy') {
  await buildAll(missing());
  const out = join(site, 'out', 'preview');
  rmSync(out, { recursive: true, force: true });
  for (const name of names) {
    cpSync(join(PREVIEWS_DIR, name), join(out, name), {
      recursive: true,
      filter: (source) => !source.endsWith(BUILT_FOR),
    });
  }
  console.log(`previews: ${String(names.length)} template(s) copied to ${relative(site, out)}/`);
} else {
  throw new Error('usage: node scripts/previews.ts build|copy|missing');
}

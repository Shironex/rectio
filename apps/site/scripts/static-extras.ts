/**
 * The last step of the site build: what out/ needs beside the pages to be served as is.
 *
 * - out/r/: the static registry the CLI and the MCP read (packages/registry builds it into
 *   dist/registry), so the site and the registry deploy together and the CLI's default URL,
 *   REGISTRY_URL in @rectio/registry, points here.
 * - out/.nojekyll: GitHub Pages skips Jekyll, which would hide Next's `_next/` folder.
 */
import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const site = join(import.meta.dirname, '..');
const out = join(site, 'out');
const registry = join(site, '..', '..', 'packages', 'registry', 'dist', 'registry');

if (!existsSync(join(registry, 'index.json'))) {
  throw new Error(`no registry at ${registry}: build @rectio/registry first (turbo does)`);
}
rmSync(join(out, 'r'), { recursive: true, force: true });
cpSync(registry, join(out, 'r'), { recursive: true });
writeFileSync(join(out, '.nojekyll'), '');
console.log('static-extras: registry copied to out/r, out/.nojekyll written');

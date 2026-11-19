import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** The site's root at build time: `next build` runs in apps/site. */
const SITE = process.cwd();
const UI_SRC = join(SITE, '..', '..', 'packages', 'ui', 'src');

/** A demo's own file, shown in its Code tab. */
export function readDemo(name: string): Promise<string> {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`bad demo name: ${name}`);
  return readFile(join(SITE, 'demos', `${name}.tsx`), 'utf8');
}

/**
 * A free component's source, as `rectio add` installs it. Only @rectio/ui is readable here: the
 * motion add-on is Pro, and its source must never reach the public site.
 */
export function readFreeSource(path: string): Promise<string> {
  if (!/^[a-z0-9-]+\/[a-z0-9-]+\.tsx?$/.test(path)) throw new Error(`bad source path: ${path}`);
  return readFile(join(UI_SRC, path), 'utf8');
}

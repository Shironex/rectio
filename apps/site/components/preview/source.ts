import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** The site's root at build time: `next build` runs in apps/site. */
const SITE = process.cwd();
const UI_SRC = join(SITE, '..', '..', 'packages', 'ui', 'src');

/** A demo's own file, shown in its Code tab: `button`, or `button.motion` for its motion twin. */
export function readDemo(name: string): Promise<string> {
  if (!/^[a-z0-9-]+(?:\.motion)?$/.test(name)) throw new Error(`bad demo name: ${name}`);
  return readFile(join(SITE, 'demos', `${name}.tsx`), 'utf8');
}

/** A component's source in @rectio/ui, as `rectio add` installs it. */
export function readComponentSource(path: string): Promise<string> {
  if (!/^[a-z0-9-]+\/[a-z0-9-]+\.tsx?$/.test(path)) throw new Error(`bad source path: ${path}`);
  return readFile(join(UI_SRC, path), 'utf8');
}

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { RegistryItem } from '@rectio/registry';

/** The registry build, read at build time; the site runs from apps/site. */
const ITEM = join(process.cwd(), '..', '..', 'packages', 'registry', 'dist', 'registry', 'items');

/**
 * The default theme's CSS exactly as the registry ships it: the template every generated theme is
 * written over. `rectio add <theme link>` fetches the same item from the registry, so the page and
 * the CLI write the same file.
 */
export function readThemeTemplate(): { css: string; version: string } {
  const item = JSON.parse(readFileSync(join(ITEM, 'theme-default.json'), 'utf8')) as RegistryItem;
  const file = item.files.find((f) => f.type === 'theme');
  if (file === undefined) throw new Error('theme-default has no theme file: rebuild the registry');
  return { css: file.content, version: item.version };
}

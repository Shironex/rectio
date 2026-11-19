import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { templateManifestSchema } from '@rectio/registry';

import { CATEGORY_LABELS, type SiteTemplate } from './template-types.ts';

/** The repo's templates folder, read at build time; the site runs from apps/site. */
export const TEMPLATES_DIR = join(process.cwd(), '..', '..', 'templates');

export { CATEGORY_LABELS, type SiteTemplate };

/** `screenshots/desktop-light.webp` -> `/templates/<name>/desktop-light.webp` (copied by the sync). */
const served = (name: string, path: string) =>
  `/templates/${name}/${path.slice('screenshots/'.length)}`;

/**
 * Every template with a template.json, in folder order, as the site shows it. A new folder under
 * templates/ appears in the docs and on the landing with no change here.
 */
export function readTemplates(): SiteTemplate[] {
  if (!existsSync(TEMPLATES_DIR)) return [];
  return readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(TEMPLATES_DIR, entry.name, 'template.json'))
    .filter((file) => existsSync(file))
    .sort()
    .map((file) => {
      const manifest = templateManifestSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
      const shots = manifest.screenshots;
      const pick = (word: string) => shots.find((s) => s.includes(word));
      const light = pick('light') ?? shots[0] ?? '';
      return {
        name: manifest.name,
        title: manifest.title,
        description: manifest.description,
        category: manifest.category,
        pages: manifest.pages,
        uses: manifest.uses,
        href: `/docs/templates/${manifest.name}`,
        command: `rectio init --template ${manifest.name}`,
        shots: {
          light: served(manifest.name, light),
          dark: served(manifest.name, pick('dark') ?? light),
          phone:
            pick('phone') === undefined ? undefined : served(manifest.name, pick('phone') ?? ''),
        },
      };
    });
}

export function readTemplate(name: string): SiteTemplate {
  const template = readTemplates().find((t) => t.name === name);
  if (template === undefined) throw new Error(`no template "${name}" in ${TEMPLATES_DIR}`);
  return template;
}

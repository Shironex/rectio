import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { templateManifestSchema } from '@rectio/registry';

import { withBase } from './base-path.ts';
import { CATEGORY_LABELS, TEMPLATE_CATEGORIES, type SiteTemplate } from './template-types.ts';

/** The repo's templates folder, read at build time; the site runs from apps/site. */
export const TEMPLATES_DIR = join(process.cwd(), '..', '..', 'templates');

export { CATEGORY_LABELS, type SiteTemplate };

/**
 * `screenshots/desktop-light.webp` -> `/templates/<name>/desktop-light.webp` (copied by the sync),
 * under the site base path: the gallery shows them in plain `<img>` tags.
 */
const served = (name: string, path: string) =>
  withBase(`/templates/${name}/${path.slice('screenshots/'.length)}`);

/**
 * Every template with a template.json, by category (apps first, the kit's home ground), then by
 * name, as the site shows it. A new folder under
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
        previewHref: `/templates/${manifest.name}`,
        command: `pnpm dlx @rectio/cli init --template ${manifest.name}`,
        shots: {
          light: served(manifest.name, light),
          dark: served(manifest.name, pick('dark') ?? light),
          phone:
            pick('phone') === undefined ? undefined : served(manifest.name, pick('phone') ?? ''),
        },
      };
    })
    .sort(
      (a, b) =>
        TEMPLATE_CATEGORIES.indexOf(a.category) - TEMPLATE_CATEGORIES.indexOf(b.category) ||
        a.name.localeCompare(b.name),
    );
}

export function readTemplate(name: string): SiteTemplate {
  const template = readTemplates().find((t) => t.name === name);
  if (template === undefined) throw new Error(`no template "${name}" in ${TEMPLATES_DIR}`);
  return template;
}

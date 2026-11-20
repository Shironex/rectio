/**
 * Turns every templates/<name>/template.json into a docs page and serves its screenshots:
 * content/docs/templates/<name>.mdx and public/templates/<name>/*. Runs before dev, build and
 * typecheck; both outputs are generated (gitignored), so a new template needs no site change.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CATEGORY_LABELS, TEMPLATES_DIR, readTemplates } from '../lib/templates.ts';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(site, 'content', 'docs', 'templates');
const publicDir = join(site, 'public', 'templates');
const KEEP = new Set(['index.mdx', 'meta.json']);

const yaml = (text: string) => `'${text.replaceAll("'", "''")}'`;

const templates = readTemplates();
mkdirSync(docs, { recursive: true });
for (const file of readdirSync(docs)) {
  if (!KEEP.has(file)) rmSync(join(docs, file));
}
rmSync(publicDir, { recursive: true, force: true });

for (const template of templates) {
  const page = [
    '---',
    `title: ${yaml(template.title)}`,
    `description: ${yaml(template.description)}`,
    '---',
    '',
    `{/* Generated from templates/${template.name}/template.json by scripts/templates.ts. */}`,
    '',
    `<TemplateShots name="${template.name}" />`,
    '',
    '## Start a project',
    '',
    `${/^[aeiou]/i.test(CATEGORY_LABELS[template.category]) ? 'An' : 'A'} ${CATEGORY_LABELS[template.category].toLowerCase()} template: a complete Next.js app with the kit items it`,
    'uses installed as your own source, MIT licensed like the rest of the kit.',
    '',
    '```sh',
    `${template.command} my-app`,
    '```',
    '',
    'The command writes the app into `my-app`, installs the components, blocks, tokens and both',
    'themes under `components/`, `lib/` and `styles/rectio/`, and points every import at them.',
    'See [init --template](/docs/cli#init---template) for the flags.',
    '',
    '## Pages',
    '',
    `<TemplatePages routes={${JSON.stringify(template.pages)}} />`,
    '',
    '## Built with',
    '',
    `<TemplateUses name="${template.name}" />`,
    '',
  ].join('\n');
  writeFileSync(join(docs, `${template.name}.mdx`), page);

  const shots = join(TEMPLATES_DIR, template.name, 'screenshots');
  if (existsSync(shots)) {
    mkdirSync(join(publicDir, template.name), { recursive: true });
    for (const file of readdirSync(shots)) {
      copyFileSync(join(shots, file), join(publicDir, template.name, file));
    }
  }
}
console.log(`templates: ${String(templates.length)} docs page(s) and screenshots`);

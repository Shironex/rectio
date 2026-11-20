/**
 * `rectio add <theme link>`: a theme made in the docs theme generator. The link carries the whole
 * theme as a code (`?theme=1.<base64url>`); the CLI decodes it here, derives and corrects the colours
 * with the same code the page runs, and writes the CSS over the registry's default theme file as
 * template. Nothing is fetched from the link itself, so any host works and none is trusted.
 */
import {
  SCHEMA_VERSION,
  TOKEN_CONTRACT_VERSION,
  itemIntegrity,
  registryItemSchema,
  sha256Hex,
  type RegistryItem,
} from '@rectio/registry';
import {
  ThemeCodeError,
  decodeTheme,
  encodeTheme,
  expandPairs,
  extractCode,
  fontDependencies,
  isThemeReference,
  renderThemeCss,
  resolveTheme,
  templateColors,
  type GeneratorData,
  type ThemeInputs,
} from '@rectio/tokens/generator';
import generatorData from '@rectio/tokens/generator.json' with { type: 'json' };

import { CliError } from './context.ts';
import { resolveItems } from './installer.ts';
import type { RegistryClient } from './registry-client.ts';

export { isThemeReference };

const data = generatorData as unknown as GeneratorData;
const pairs = expandPairs(data.pairs);
const TEMPLATE_ITEM = 'theme-default';

/** The theme inputs in a link or code, or a CliError that says what is wrong with it. */
export function readThemeLink(reference: string): ThemeInputs {
  try {
    return decodeTheme(reference);
  } catch (error) {
    if (error instanceof ThemeCodeError)
      throw new CliError(
        `that theme link does not hold a theme: ${error.message}`,
        'Copy the command again from the theme generator page.',
      );
    throw error;
  }
}

/** The code of a link, normalized: the lock stores it so diff and update can rebuild the theme. */
export function themeCode(reference: string): string {
  return encodeTheme(readThemeLink(reference));
}

/** The registry's default theme, the template every generated theme is written over. */
export async function fetchTemplate(client: RegistryClient): Promise<RegistryItem> {
  const [entry] = (await resolveItems(client, [TEMPLATE_ITEM])).filter(
    (e) => e.name === TEMPLATE_ITEM,
  );
  if (entry === undefined) throw new CliError(`the registry has no ${TEMPLATE_ITEM}`);
  return client.item(entry);
}

/** The generated theme's CSS, exactly as the theme generator page shows it. */
export function themeCss(inputs: ThemeInputs, template: RegistryItem): string {
  const file = template.files.find((f) => f.type === 'theme');
  if (file === undefined) throw new CliError(`${TEMPLATE_ITEM} has no theme file`);
  const resolved = resolveTheme(inputs, pairs, templateColors(file.content));
  return renderThemeCss(file.content, inputs, resolved, data.compact);
}

/**
 * A registry item for the theme, built locally: `theme-<name>`, one CSS file beside the default
 * theme, the font packages it imports, and the tokens it rests on. Its version follows the
 * template's, so a newer default theme shows up as a change in `rectio diff`.
 */
export function themeItem(reference: string, template: RegistryItem): RegistryItem {
  const inputs = readThemeLink(reference);
  const name = `theme-${inputs.name}`;
  if (name === TEMPLATE_ITEM)
    throw new CliError(
      'a generated theme cannot be called "default"',
      'Pick another name in the theme generator.',
    );
  const content = themeCss(inputs, template);
  const id = inputs.name;
  const body: Omit<RegistryItem, 'integrity' | '$schema'> = {
    schemaVersion: SCHEMA_VERSION,
    name,
    version: template.version,
    type: 'theme',
    title: `${id.charAt(0).toUpperCase()}${id.slice(1).replace(/-/g, ' ')} theme`,
    description: 'Made with the rectio theme generator. Light and dark.',
    categories: ['theme'],
    dependencies: fontDependencies(inputs),
    devDependencies: {},
    registryDependencies: ['tokens'],
    requires: { tokenContract: TOKEN_CONTRACT_VERSION },
    files: [
      {
        path: `styles/themes/${id}.css`,
        type: 'theme',
        target: `@styles/themes/${id}.css`,
        content,
        sha256: sha256Hex(content),
      },
    ],
    theme: { id, modes: ['light', 'dark'], densities: ['comfortable', 'compact'] },
    docs: `It takes over :root, so the app uses it at once. Set data-theme="${id}" on <html> (or wrap a subtree in ThemeScope) to name it.`,
    meta: { themeCode: encodeTheme(inputs) },
  };
  return registryItemSchema.parse({ ...body, integrity: itemIntegrity(body) });
}

/** The theme code a generated item carries, if it is one. */
export function codeOf(item: RegistryItem): string | undefined {
  const code = item.meta?.themeCode;
  return typeof code === 'string' ? code : undefined;
}

/** Splits `add` arguments into registry item names and theme links. */
export function splitThemeLinks(names: readonly string[]): { names: string[]; links: string[] } {
  const links = names.filter((n) => isThemeReference(n));
  for (const link of links)
    if (extractCode(link) === undefined)
      throw new CliError(
        `${link} is a link, not an item, and holds no theme code`,
        'Theme links come from the theme generator and end in ?theme=<code>.',
      );
  return { names: names.filter((n) => !isThemeReference(n)), links };
}
